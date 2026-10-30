package ru.ifmo.se.dto.response;

import java.util.List;

import lombok.Builder;
import lombok.Data;
import ru.ifmo.se.exception.ErrorCodes;

@Data
@Builder
public class ErrorDto {
    ErrorCodes code;
    String message;
    List<Details> details;

    @Data
    @Builder
    public static class Details {
        String field;
        String message;
    }
}
