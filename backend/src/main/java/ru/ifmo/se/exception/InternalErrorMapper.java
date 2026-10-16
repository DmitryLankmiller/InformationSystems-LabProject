// package ru.ifmo.se.exception;

// import jakarta.ws.rs.core.Response;
// import jakarta.ws.rs.core.Response.Status;
// import jakarta.ws.rs.ext.ExceptionMapper;
// import jakarta.ws.rs.ext.Provider;
// import ru.ifmo.se.dto.ErrorDto;

// @Provider
// public class InternalErrorMapper implements ExceptionMapper<Exception> {

//     @Override
//     public Response toResponse(Exception exception) {
//         ErrorDto dto = ErrorDto.builder()
//                 .code(ErrorCodes.INTERNAL_ERROR)
//                 .message("Internal error")
//                 .build();

//         return Response.status(Status.INTERNAL_SERVER_ERROR)
//                 .entity(dto)
//                 .build();
//     }

// }
