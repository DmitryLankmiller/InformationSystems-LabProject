package ru.ifmo.se.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCoordinatesDto {
    @NotNull
    @Max(value = 434)
    private Integer x;
    @NotNull
    private Float y;
}
