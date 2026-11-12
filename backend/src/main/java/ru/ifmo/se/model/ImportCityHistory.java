package ru.ifmo.se.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "import_city_history")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ImportCityHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private int id;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "user_id")
    private int userId;

    @Column(name = "import_status")
    @Enumerated(EnumType.STRING)
    private ImportStatus importStatus;

    @Column(name = "import_date", insertable = false, updatable = false)
    @Setter(AccessLevel.NONE)
    private java.time.LocalDateTime importDate;

    @Column(name = "imported_rows_count")
    private Integer importedRowsCount;
}
