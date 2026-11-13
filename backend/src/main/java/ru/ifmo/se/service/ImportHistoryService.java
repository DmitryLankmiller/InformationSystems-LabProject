package ru.ifmo.se.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import jakarta.transaction.Transactional.TxType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import ru.ifmo.se.exception.ImportSubmissionException;
import ru.ifmo.se.exception.UpdateImportHistoryException;
import ru.ifmo.se.model.ImportCityHistory;
import ru.ifmo.se.model.ImportStatus;
import ru.ifmo.se.repository.ImportCityHistoryRepository;

@Named
@ApplicationScoped
public class ImportHistoryService {
    @Inject
    private ImportCityHistoryRepository historyRepository;

    @Transactional
    public ImportCityHistory getImportHistoryById(@NotNull @Positive Integer id) {
        return historyRepository.findById(id).orElseThrow();
    }

    @Transactional(value = TxType.REQUIRES_NEW)
    public ImportCityHistory createNewImportHistory(String fileName) {
        try {
            ImportCityHistory history = ImportCityHistory.builder()
                .fileName(fileName)
                .userId(0)
                .importStatus(ImportStatus.RUNNING)
                .build();
            return historyRepository.save(history);
        } catch (RuntimeException e) { // db errors
            throw new ImportSubmissionException(e);
        }
    }

    @Transactional(value = TxType.REQUIRES_NEW)
    public void markImportHistorySuccess(ImportCityHistory history, int rows) {
        try {
            history.setImportStatus(ImportStatus.SUCCESS);
            history.setImportedRowsCount(rows);
            historyRepository.update(history);
        } catch (RuntimeException e) { // db exception
            throw new UpdateImportHistoryException();
        }
    }

    @Transactional(value = TxType.REQUIRED)
    public void markImportHistorySuccess(int historyId, int rows) {
        ImportCityHistory history = historyRepository.findById(historyId).orElseThrow();
        markImportHistorySuccess(history, rows);
    }

    @Transactional(value = TxType.REQUIRES_NEW)
    public ImportCityHistory markImportHistoryFailed(ImportCityHistory history, String errorMsg) {
        history.setImportStatus(ImportStatus.FAILED);
        history.setErrorMsg(errorMsg);
        return historyRepository.update(history);
    }

    @Transactional(value = TxType.REQUIRED)
    public ImportCityHistory markImportHistoryFailed(int historyId, String errorMsg) {
        ImportCityHistory history = historyRepository.findById(historyId).orElseThrow();
        return markImportHistoryFailed(history, errorMsg);
    }
}
