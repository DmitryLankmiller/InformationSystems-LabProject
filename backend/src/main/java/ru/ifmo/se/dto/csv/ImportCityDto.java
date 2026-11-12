package ru.ifmo.se.dto.csv;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import ru.ifmo.se.model.Climate;
import ru.ifmo.se.model.StandardOfLiving;

@Data
public class ImportCityDto {
    @NotBlank
    private String name; // Поле не может быть null, Строка не может быть пустой
    @Max(value = 434)
    @NotNull
    private Integer coordinatesX; // Максимальное значение поля: 434, Поле не может быть null
    @NotNull
    private Float coordinatesY; // Поле не может быть null
    @NotNull
    @Positive
    private Float area; // Значение поля должно быть больше 0
    @NotNull
    @Positive
    private Integer population; // Значение поля должно быть больше 0
    private java.time.ZonedDateTime establishmentDate;
    @NotNull
    private Boolean capital; // Поле не может быть null
    private Double metersAboveSeaLevel;
    @Positive
    @Max(value = 100000)
    private Long telephoneCode; // Значение поля должно быть больше 0, Максимальное значение поля: 100000
    private Climate climate; // Поле может быть null
    private StandardOfLiving standardOfLiving; // Поле может быть null
    private Integer governorId;
    private String governorName;
    private java.time.ZonedDateTime governorBirthday;

    @AssertTrue
    private boolean isGovernorProvided() {
        return governorId != null || governorName != null && !governorName.isBlank();
    }
}
