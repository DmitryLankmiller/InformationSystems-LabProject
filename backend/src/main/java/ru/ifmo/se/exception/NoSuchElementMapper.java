package ru.ifmo.se.exception;

import java.util.NoSuchElementException;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import ru.ifmo.se.dto.ErrorDto;

@Provider
public class NoSuchElementMapper implements ExceptionMapper<NoSuchElementException> {

    @Override
    public Response toResponse(NoSuchElementException exception) {
        ErrorDto dto = ErrorDto.builder()
            .code(ErrorCodes.NO_ELEMENT)
            .message("Element is not found")
            .build();

        return Response.status(Status.NOT_FOUND)
            .entity(dto)
            .build();
    }

}
