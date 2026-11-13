package ru.ifmo.se.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

@Data
public class RegisterUserDto {
    @NotBlank(message = "Укажите логин.")
    @Size(max = 64, message = "Логин должен содержать не больше {max} символов.")
    @Pattern(regexp = "[^:\\s\\p{Cntrl}]+", message = "Логин не должен содержать пробелы, двоеточия и управляющие символы.")
    private String login;

    @NotBlank(message = "Укажите пароль.")
    @Size(min = 8, max = 128, message = "Пароль должен содержать от {min} до {max} символов.")
    @Pattern(regexp = "[^\\p{Cntrl}]+", message = "Пароль не должен содержать управляющие символы.")
    @ToString.Exclude
    private String password;
}
