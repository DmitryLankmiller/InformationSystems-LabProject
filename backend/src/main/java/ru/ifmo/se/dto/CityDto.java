package ru.ifmo.se.dto;

import lombok.Builder;
import lombok.Data;
import ru.ifmo.se.model.City;
import ru.ifmo.se.model.Climate;
import ru.ifmo.se.model.StandardOfLiving;

@Data
@Builder
public class CityDto {
    private long id;
    private String name;
    private CoordianatesDto coordinates;
    private java.time.LocalDateTime creationDate;
    private float area;
    private int population;
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
                .coordinates(CoordianatesDto.from(city.getCoordinates()))
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
