package ru.ifmo.se.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.RejectedExecutionException;

import jakarta.annotation.Resource;
import jakarta.enterprise.concurrent.ManagedExecutorService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import jakarta.transaction.Transactional.TxType;
import ru.ifmo.se.exception.ImportDataException;
import ru.ifmo.se.exception.ImportSubmissionException;
import ru.ifmo.se.exception.UpdateImportHistoryException;
import ru.ifmo.se.model.ImportCityHistory;

@Named
@ApplicationScoped
public class ImportCityService {
    @Resource(lookup = "java:comp/DefaultManagedExecutorService")
    private ManagedExecutorService executor;
    @Inject
    private ImportHistoryService historyService;
    @Inject
    private ImportCityExecutor importExecutor;

    private Runnable importTask(InputStream in, int historyId) throws IOException {
        return () -> {
            int rows = 0;
            try {
                rows = importExecutor.executeImport(in, historyId);
            } catch (ImportDataException e) {
                historyService.markImportHistoryFailed(historyId, e.getMessage());
                return;
            } catch (RuntimeException e) {
                historyService.markImportHistoryFailed(historyId, "bad news for devs...");
                // log...
                return;
            }
            try {
                historyService.markImportHistorySuccess(historyId, rows);
            } catch (UpdateImportHistoryException e) {
                // log...
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
            historyService.markImportHistoryFailed(history, e.getMessage());
            throw new ImportSubmissionException(e);
        }

        return history;
    }
}
