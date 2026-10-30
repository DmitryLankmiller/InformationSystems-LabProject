package ru.ifmo.se.dto.response;

import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import lombok.Builder;
import lombok.Data;
import ru.ifmo.se.model.City;
import ru.ifmo.se.model.Climate;
import ru.ifmo.se.model.StandardOfLiving;

@Data
@Builder
@Schema
public class CityDto {
    private long id;
    private String name;
    private CoordinatesDto coordinates;
    @Schema (type = SchemaType.STRING)
    private java.time.LocalDateTime creationDate;
    private float area;
    private int population;
    @Schema (type = SchemaType.STRING)
    private java.time.ZonedDateTime establishmentDate;
    private Boolean capital;
    private Double metersAboveSeaLevel;
    private Long telephoneCode;
    private Climate climate;
    private StandardOfLiving standardOfLiving;
    private HumanDto governor;

    public static CityDto from(City city) {
        return CityDto.builder()
            .id(city.getId())
            .name(city.getName())
            .coordinates(CoordinatesDto.from(city.getCoordinates()))
            .creationDate(city.getCreationDate())
            .area(city.getArea())
            .population(city.getPopulation())
            .establishmentDate(city.getEstablishmentDate())
            .capital(city.getCapital())
            .metersAboveSeaLevel(city.getMetersAboveSeaLevel())
            .telephoneCode(city.getTelephoneCode())
            .climate(city.getClimate())
            .standardOfLiving(city.getStandardOfLiving())
            .governor(HumanDto.from(city.getGovernor()))
            .build();
    }
}
