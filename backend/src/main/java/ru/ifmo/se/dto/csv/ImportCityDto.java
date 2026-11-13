package ru.ifmo.se.dto.csv;

import com.fasterxml.jackson.annotation.JsonProperty;

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
    @NotBlank(message = "Название города не должно быть пустым.")
    private String name; // Поле не может быть null, Строка не может быть пустой
    @JsonProperty(value = "coordinates_x")
    @Max(value = 434, message = "Координата X должна быть не больше {value}.")
    @NotNull(message = "Координата X обязательна.")
    private Integer coordinatesX; // Максимальное значение поля: 434, Поле не может быть null
    @JsonProperty(value = "coordinates_y")
    @NotNull(message = "Координата Y обязательна.")
    private Float coordinatesY; // Поле не может быть null
    @NotNull(message = "Площадь обязательна.")
    @Positive(message = "Площадь должна быть больше нуля.")
    private Float area; // Значение поля должно быть больше 0
    @NotNull(message = "Численность населения обязательна.")
    @Positive(message = "Численность населения должна быть больше нуля.")
    private Integer population; // Значение поля должно быть больше 0
    @JsonProperty(value = "establishment_date")
    private java.time.ZonedDateTime establishmentDate;
    @NotNull(message = "Признак столицы обязателен.")
    private Boolean capital; // Поле не может быть null
    @JsonProperty(value = "meters_above_sea_level")
    private Double metersAboveSeaLevel;
    @JsonProperty(value = "telephone_code")
    @Positive(message = "Телефонный код должен быть больше нуля.")
    @Max(value = 100000, message = "Телефонный код должен быть не больше {value}.")
    private Long telephoneCode; // Значение поля должно быть больше 0, Максимальное значение поля: 100000
    private Climate climate; // Поле может быть null
    @JsonProperty(value = "standard_of_living")
    private StandardOfLiving standardOfLiving; // Поле может быть null
    @JsonProperty(value = "governor_id")
    private Integer governorId;
    @JsonProperty(value = "governor_name")
    private String governorName;
    @JsonProperty(value = "governor_birthday")
    private java.time.ZonedDateTime governorBirthday;

    @AssertTrue(message = "Укажите ID существующего губернатора или непустое имя нового.")
    private boolean isGovernorProvided() {
        return governorId != null || governorName != null && !governorName.isBlank();
    }
}
