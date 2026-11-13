package ru.ifmo.se.service;

import jakarta.data.Order;
import jakarta.data.Sort;
import jakarta.data.page.Page;
import jakarta.data.page.PageRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import jakarta.transaction.Transactional.TxType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import ru.ifmo.se.dto.response.ImportCityHistoryDto;
import ru.ifmo.se.dto.response.PageResponse;
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

    @Transactional
    public PageResponse<ImportCityHistoryDto> getImportHistory(int page, int size, String login, boolean admin) {
        PageRequest request = PageRequest.ofPage(page, size, true);
        Order<ImportCityHistory> order = Order.by(Sort.desc("id"));
        Page<ImportCityHistory> history = admin
            ? historyRepository.findAll(request, order)
            : historyRepository.findByUserLogin(login, request, order);

        return PageResponse.<ImportCityHistoryDto>builder()
            .page(page)
            .size(size)
            .hasNext(history.hasNext())
            .totalPages(history.totalPages())
            .totalElements(history.totalElements())
            .content(history.content().stream().map(ImportCityHistoryDto::from).toList())
            .build();
    }

    @Transactional(value = TxType.REQUIRES_NEW)
    public ImportCityHistory createNewImportHistory(String fileName, String userLogin) {
        try {
            ImportCityHistory history = ImportCityHistory.builder()
                .fileName(fileName)
                .userLogin(userLogin)
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
            history.setErrorMsg(null);
            historyRepository.update(history);
        } catch (RuntimeException e) { // db exception
            throw new UpdateImportHistoryException("Не удалось сохранить результат импорта.", e);
        }
    }

    @Transactional(value = TxType.REQUIRES_NEW)
    public void markImportHistorySuccess(int historyId, int rows) {
        ImportCityHistory history = historyRepository.findById(historyId).orElseThrow();
        markImportHistorySuccess(history, rows);
    }

    @Transactional(value = TxType.REQUIRES_NEW)
    public ImportCityHistory markImportHistoryFailed(ImportCityHistory history, String errorMsg) {
        history.setImportStatus(ImportStatus.FAILED);
        history.setImportedRowsCount(null);
        history.setErrorMsg(errorMsg);
        return historyRepository.update(history);
    }

    @Transactional(value = TxType.REQUIRES_NEW)
    public ImportCityHistory markImportHistoryFailed(int historyId, String errorMsg) {
        ImportCityHistory history = historyRepository.findById(historyId).orElseThrow();
        return markImportHistoryFailed(history, errorMsg);
    }
}
