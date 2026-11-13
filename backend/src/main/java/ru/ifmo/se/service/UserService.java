package ru.ifmo.se.service;

import java.sql.SQLException;
import java.util.Map;
import java.util.Optional;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.security.enterprise.identitystore.Pbkdf2PasswordHash;
import ru.ifmo.se.dto.request.RegisterUserDto;
import ru.ifmo.se.model.User;
import ru.ifmo.se.model.UserRole;
import ru.ifmo.se.repository.UserRepository;

@ApplicationScoped
public class UserService {
    @Inject
    private UserRepository repository;
    @Inject
    private Pbkdf2PasswordHash passwordHash;

    @PostConstruct
    void configurePasswordHash() {
        passwordHash.initialize(Map.of(
            "Pbkdf2PasswordHash.Algorithm", "PBKDF2WithHmacSHA256",
            "Pbkdf2PasswordHash.Iterations", "600000"));
    }

    public Optional<User> register(RegisterUserDto dto) {
        if (repository.findByLogin(dto.getLogin()).isPresent()) {
            return Optional.empty();
        }
        User user = User.builder()
            .login(dto.getLogin())
            .passwordHash(passwordHash.generate(dto.getPassword().toCharArray()))
            .role(UserRole.USER)
            .build();
        try {
            return Optional.of(repository.insert(user));
        } catch (RuntimeException e) {
            for (Throwable cause = e; cause != null; cause = cause.getCause()) {
                if (cause instanceof SQLException sql && "23505".equals(sql.getSQLState())) {
                    return Optional.empty();
                }
            }
            throw e;
        }
    }

    public Optional<User> authenticate(String login, String password) {
        return repository.findByLogin(login)
            .filter(user -> user.getPasswordHash() != null)
            .filter(user -> passwordHash.verify(password.toCharArray(), user.getPasswordHash()));
    }

    public User getByLogin(String login) {
        return repository.findByLogin(login).orElseThrow();
    }
}
