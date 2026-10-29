package ru.ifmo.se.dto;

import lombok.Builder;
import lombok.Data;
import ru.ifmo.se.model.Coordinates;

@Data
@Builder
public class CoordianatesDto {
    private int id;
    private Integer x;
    private Float y;

    public static CoordianatesDto from(Coordinates coordinates) {
        return CoordianatesDto.builder()
            .id(coordinates.getId())
            .x(coordinates.getX())
            .y(coordinates.getY())
            .build();
    }
}
