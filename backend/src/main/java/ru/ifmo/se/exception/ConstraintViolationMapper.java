package ru.ifmo.se.exception;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import ru.ifmo.se.dto.ErrorDto;

@Provider
public class ConstraintViolationMapper implements ExceptionMapper<ConstraintViolationException> {

    @Override
    public Response toResponse(ConstraintViolationException exception) {
        Set<ConstraintViolation<?>> constraintViolations = exception.getConstraintViolations();

        var dtoBuilder = ErrorDto.builder()
            .code(ErrorCodes.CONSTRAINT_VIOLATION)
            .message("Violation of data model constraints");

        List<ErrorDto.Details> detailsList = new ArrayList<>();

        for (final var constraint : constraintViolations) {

            String message = constraint.getMessage();
            String propertyPath = constraint.getPropertyPath().toString();

            ErrorDto.Details details = ErrorDto.Details.builder()
                .field(propertyPath)
                .message(message)
                .build();

            detailsList.add(details);
        }

        ErrorDto dto = dtoBuilder.details(detailsList).build();

        return Response.status(422)
            .entity(dto)
            .build();
    }

}
