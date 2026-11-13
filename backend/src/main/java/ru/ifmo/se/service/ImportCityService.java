package ru.ifmo.se.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.sql.SQLException;
import java.util.concurrent.RejectedExecutionException;
import java.util.logging.Level;
import java.util.logging.Logger;

import jakarta.annotation.Resource;
import jakarta.enterprise.concurrent.ManagedExecutorService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import jakarta.transaction.Transactional.TxType;
import ru.ifmo.se.exception.ImportDataException;
import ru.ifmo.se.exception.ImportSubmissionException;
import ru.ifmo.se.model.ImportCityHistory;

@Named
@ApplicationScoped
public class ImportCityService {
    private static final Logger LOGGER = Logger.getLogger(ImportCityService.class.getName());

    @Resource(lookup = "java:comp/DefaultManagedExecutorService")
    private ManagedExecutorService executor;
    @Inject
    private ImportHistoryService historyService;
    @Inject
    private ImportCityExecutor importExecutor;

    private Runnable importTask(InputStream in, int historyId) {
        return () -> {
            int rows;
            try {
                rows = importExecutor.executeImport(in, historyId);
            } catch (RuntimeException e) {
                markFailed(historyId, e);
                return;
            }
            try {
                historyService.markImportHistorySuccess(historyId, rows);
            } catch (RuntimeException e) {
                LOGGER.log(Level.SEVERE,
                    "Города импорта " + historyId + " сохранены, но не удалось обновить историю.", e);
            }
        };
    }

    @Transactional(value = TxType.REQUIRED)
    public ImportCityHistory acceptImport(InputStream in, String fileName) {
        ImportCityHistory history = historyService.createNewImportHistory(fileName);
        try {
            InputStream copyIn = new ByteArrayInputStream(in.readAllBytes());
            executor.submit(importTask(copyIn, history.getId()));
        } catch (IOException | RejectedExecutionException e) {
            markFailed(history.getId(), e);
            throw new ImportSubmissionException(e);
        }

        return history;
    }

    private void markFailed(int historyId, Exception error) {
        LOGGER.log(Level.WARNING, "Импорт " + historyId + " не выполнен.", error);
        try {
            historyService.markImportHistoryFailed(historyId, failureMessage(error));
        } catch (RuntimeException historyError) {
            LOGGER.log(Level.SEVERE, "Не удалось сохранить ошибку импорта " + historyId + ".", historyError);
        }
    }

    private String failureMessage(Exception error) {
        if (error instanceof IOException) {
            return "Не удалось прочитать загруженный CSV-файл.";
        }
        if (error instanceof RejectedExecutionException) {
            return "Не удалось запустить импорт. Повторите попытку позже.";
        }
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof ImportDataException dataError) {
                return dataError.getMessage();
            }
            if (cause instanceof SQLException sqlError) {
                String state = sqlError.getSQLState();
                if (state != null) {
                    return switch (state) {
                        case "23505" -> "Импорт содержит повторяющиеся значения или конфликтует с существующими данными.";
                        case "23503" -> "Связанный объект не найден или был удалён во время импорта.";
                        case "23502" -> "Не заполнено обязательное поле.";
                        case "23514" -> "Значения нарушают ограничения предметной области.";
                        default -> "Не удалось завершить импорт из-за ошибки базы данных.";
                    };
                }
            }
        }
        return "Не удалось завершить импорт из-за внутренней ошибки сервера.";
    }
}
