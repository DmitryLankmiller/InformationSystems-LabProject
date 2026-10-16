package ru.ifmo.se.exception;

import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import ru.ifmo.se.dto.ErrorDto;

@Provider
public class ProcessingMapper implements ExceptionMapper<ProcessingException> {

    @Override
    public Response toResponse(ProcessingException exception) {
        ErrorDto dto = ErrorDto.builder()
                .code(ErrorCodes.PROCESSING_ERROR)
                .message("Failed to process the request")
                .build();

        return Response.status(Status.BAD_REQUEST)
                .entity(dto)
                .build();
    }

}
