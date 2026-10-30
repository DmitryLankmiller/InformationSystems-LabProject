package ru.ifmo.se.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import ru.ifmo.se.dto.response.ErrorDto;

@Provider
public class NothingToDeleteMapper implements ExceptionMapper<NothingToDeleteException> {

    @Override
    public Response toResponse(NothingToDeleteException exception) {
        ErrorDto dto = ErrorDto.builder()
            .code(ErrorCodes.NO_ELEMENT)
            .message("No element for deletion")
            .build();

        return Response.status(Status.CONFLICT)
            .entity(dto)
            .build();
    }

}
