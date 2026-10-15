package ru.ifmo.se.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import ru.ifmo.se.model.Climate;
import ru.ifmo.se.model.StandardOfLiving;

@Data
public class UpdateCityDto {
    private String name;
    @Valid
    private UpdateCoordinatesDto coordinates;
    @Positive
    private Float area;
    @Positive
    private Integer population;
    private java.time.ZonedDateTime establishmentDate;
    private Boolean annulateEstablishmentDate;
    private Boolean capital;
    private Double metersAboveSeaLevel;
    private Boolean annulateMetersAboveSeaLevel;
    @Positive
    @Max(value = 100_000)
    private Long telephoneCode;
    private Boolean annulateTelephoneCode;
    private Climate climate;
    private Boolean annulateClimate;
    private StandardOfLiving standardOfLiving;
    private Boolean annulateStandardOfLiving;

    @AssertTrue
    private boolean isNotBlankFieldsValid() {
        if (name != null) {
            return !name.isBlank();
        }
        return true;
    }
}
