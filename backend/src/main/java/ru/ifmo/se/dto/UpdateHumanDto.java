package ru.ifmo.se.dto;

import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

@Data
public class UpdateHumanDto {
    private String name;
    private java.time.ZonedDateTime birthday;
    private Boolean annulateBirthday;

    @AssertTrue
    private boolean isNotBlankFieldsValid() {
        if (name != null) {
            return !name.isBlank();
        }
        return true;
    }
}