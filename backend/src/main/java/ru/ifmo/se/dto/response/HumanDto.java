package ru.ifmo.se.dto.response;

import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import lombok.Builder;
import lombok.Data;
import ru.ifmo.se.model.Human;

@Data
@Builder
public class HumanDto {
    private int id;
    private String name;
    @Schema(type = SchemaType.STRING)
    private java.time.ZonedDateTime birthday;

    public static HumanDto from(Human human) {
        return HumanDto.builder()
            .id(human.getId())
            .name(human.getName())
            .birthday(human.getBirthday())
            .build();
    }
}
