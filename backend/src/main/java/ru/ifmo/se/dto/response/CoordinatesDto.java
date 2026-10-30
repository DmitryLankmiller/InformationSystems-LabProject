package ru.ifmo.se.dto.response;

import lombok.Builder;
import lombok.Data;
import ru.ifmo.se.model.Coordinates;

@Data
@Builder
public class CoordinatesDto {
    private int id;
    private Integer x;
    private Float y;

    public static CoordinatesDto from(Coordinates coordinates) {
        return CoordinatesDto.builder()
            .id(coordinates.getId())
            .x(coordinates.getX())
            .y(coordinates.getY())
            .build();
    }
}
