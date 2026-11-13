package ru.ifmo.se.security;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Base64;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.ext.Provider;
import ru.ifmo.se.dto.response.ErrorDto;
import ru.ifmo.se.exception.ErrorCodes;
import ru.ifmo.se.service.UserService;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class BasicAuthFilter implements ContainerRequestFilter {
    @Inject
    private UserService userService;

    @Override
    public void filter(ContainerRequestContext request) {
        var segments = request.getUriInfo().getPathSegments();
        if ("OPTIONS".equals(request.getMethod()) || segments.isEmpty()) {
            return;
        }
        String resource = segments.getFirst().getPath();
        if (!resource.equals("import") && !resource.equals("login")) {
            return;
        }
        String header = request.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.regionMatches(true, 0, "Basic ", 0, 6)) {
            unauthorized(request);
            return;
        }
        String credentials;
        try {
            byte[] bytes = Base64.getDecoder().decode(header.substring(6).trim());
            credentials = StandardCharsets.UTF_8.newDecoder().decode(ByteBuffer.wrap(bytes)).toString();
        } catch (IllegalArgumentException | CharacterCodingException e) {
            unauthorized(request);
            return;
        }
        int separator = credentials.indexOf(':');
        if (separator < 1 || credentials.chars().anyMatch(Character::isISOControl)) {
            unauthorized(request);
            return;
        }
        var user = userService.authenticate(credentials.substring(0, separator), credentials.substring(separator + 1));
        if (user.isEmpty()) {
            unauthorized(request);
            return;
        }
        var authenticatedUser = user.get();
        boolean secure = request.getSecurityContext().isSecure();
        request.setSecurityContext(new SecurityContext() {
            @Override
            public Principal getUserPrincipal() {
                return authenticatedUser::getLogin;
            }

            @Override
            public boolean isUserInRole(String role) {
                return authenticatedUser.getRole().name().equals(role);
            }

            @Override
            public boolean isSecure() {
                return secure;
            }

            @Override
            public String getAuthenticationScheme() {
                return BASIC_AUTH;
            }
        });
    }

    private void unauthorized(ContainerRequestContext request) {
        request.abortWith(Response.status(Response.Status.UNAUTHORIZED)
            .header(HttpHeaders.WWW_AUTHENTICATE, "Basic realm=\"city-manager\", charset=\"UTF-8\"")
            .type(MediaType.APPLICATION_JSON)
            .entity(ErrorDto.builder().code(ErrorCodes.UNAUTHORIZED)
                .message("Укажите правильные логин и пароль через Basic Auth.").build())
            .build());
    }
}
