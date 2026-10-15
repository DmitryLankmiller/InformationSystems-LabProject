package ru.ifmo.se.dto;

import lombok.Builder;
import lombok.Data;
import ru.ifmo.se.model.Human;

@Data
@Builder
public class HumanDto {
    private int id;
    private String name;
    private java.time.ZonedDateTime birthday;

    public static HumanDto from(Human human) {
        return HumanDto.builder()
                .id(human.getId())
                .name(human.getName())
                .birthday(human.getBirthday())
                .build();
    }
}
