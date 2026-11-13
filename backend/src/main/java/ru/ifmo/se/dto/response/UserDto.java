package ru.ifmo.se.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import ru.ifmo.se.model.User;
import ru.ifmo.se.model.UserRole;

@Data
@AllArgsConstructor
public class UserDto {
    private int id;
    private String login;
    private UserRole role;

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getLogin(), user.getRole());
    }
}
