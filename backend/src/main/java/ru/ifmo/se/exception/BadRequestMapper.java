package ru.ifmo.se.exception;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import ru.ifmo.se.dto.ErrorDto;

@Provider
public class BadRequestMapper implements ExceptionMapper<BadRequestException> {

    @Override
    public Response toResponse(BadRequestException exception) {
        ErrorDto dto = ErrorDto.builder()
            .code(ErrorCodes.PROCESSING_ERROR)
            .message("Bad request")
            .build();

        return Response.status(Status.BAD_REQUEST)
            .entity(dto)
            .build();
    }

}
