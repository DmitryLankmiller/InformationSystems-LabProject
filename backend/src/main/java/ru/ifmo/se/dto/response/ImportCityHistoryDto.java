package ru.ifmo.se.dto.response;

import lombok.Builder;
import lombok.Data;
import ru.ifmo.se.model.ImportCityHistory;
import ru.ifmo.se.model.ImportStatus;

@Data
@Builder
public class ImportCityHistoryDto {
    private int id;
    private String fileName;
    private int userId;
    private ImportStatus importStatus;
    private java.time.LocalDateTime importDate;
    private Integer importedRowsCount;
    private String errorMsg;

    public static ImportCityHistoryDto from(ImportCityHistory e) {
        return ImportCityHistoryDto.builder()
            .id(e.getId())
            .fileName(e.getFileName())
            .userId(e.getUserId())
            .importStatus(e.getImportStatus())
            .importDate(e.getImportDate())
            .importedRowsCount(e.getImportedRowsCount())
            .errorMsg(e.getErrorMsg())
            .build();
    }
}
