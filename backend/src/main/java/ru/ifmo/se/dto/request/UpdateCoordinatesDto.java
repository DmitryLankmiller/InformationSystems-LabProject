package ru.ifmo.se.dto.request;

import jakarta.validation.constraints.Max;
import lombok.Data;

@Data
public class UpdateCoordinatesDto {
    @Max(value = 434)
    private Integer x;
    private Float y;
}
