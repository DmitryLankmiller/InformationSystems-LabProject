package ru.ifmo.se.resource;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import ru.ifmo.se.dto.request.RegisterUserDto;
import ru.ifmo.se.dto.response.ErrorDto;
import ru.ifmo.se.dto.response.UserDto;
import ru.ifmo.se.exception.ErrorCodes;
import ru.ifmo.se.service.UserService;

@Path("/")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {
    @Inject
    private UserService userService;

    @POST
    @Path("register")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response register(@NotNull @Valid RegisterUserDto dto) {
        var user = userService.register(dto);
        if (user.isEmpty()) {
            return Response.status(Response.Status.CONFLICT)
                .entity(ErrorDto.builder()
                    .code(ErrorCodes.CONFLICT)
                    .message("Пользователь с таким логином уже существует.")
                    .build())
                .build();
        }
        return Response.status(Response.Status.CREATED)
            .entity(UserDto.from(user.get())).build();
    }

    @POST
    @Path("login")
    public Response login(@Context SecurityContext securityContext) {
        var user = userService.getByLogin(securityContext.getUserPrincipal().getName());
        return Response.ok(UserDto.from(user))
            .header("Cache-Control", "no-store")
            .build();
    }
}
