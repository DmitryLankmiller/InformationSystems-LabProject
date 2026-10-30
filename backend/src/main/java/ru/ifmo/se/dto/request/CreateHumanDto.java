package ru.ifmo.se.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateHumanDto {
    @NotBlank
    private String name;
    private java.time.ZonedDateTime birthday;
}
