package ru.ifmo.se.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import ru.ifmo.se.model.Climate;
import ru.ifmo.se.model.StandardOfLiving;

@Data
public class CreateCityDto {
    @NotNull
    @NotBlank
    private String name;
    @Valid
    @NotNull
    private CreateCoordinatesDto coordinates;
    @Positive
    private float area;
    @Positive
    private int population;
    private java.time.ZonedDateTime establishmentDate;
    @NotNull
    private Boolean capital;
    private Double metersAboveSeaLevel;
    @Positive
    @Max(value = 100_000)
    private Long telephoneCode;
    private Climate climate;
    private StandardOfLiving standardOfLiving;
    @Valid
    private CreateHumanDto governor;
    private Integer governorId;

    @AssertTrue
    private boolean isGovernorProvided() {
        return governor == null && governorId != null || governor != null && governorId == null;
    }
}
