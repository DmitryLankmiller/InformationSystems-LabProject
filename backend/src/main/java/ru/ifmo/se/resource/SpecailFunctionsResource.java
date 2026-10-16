package ru.ifmo.se.resource;

import java.util.List;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import ru.ifmo.se.dto.CityDto;
import ru.ifmo.se.model.City;
import ru.ifmo.se.service.SpecialFunctionsService;

@Path("cities/manage")
@RequestScoped
public class SpecailFunctionsResource {
    @Inject
    private SpecialFunctionsService service;

    @GET
    @Path("min-telephone-code")
    public Response minTelephoneCode() {
        City city = service.selectCityByMinTelephoneCode();

        return Response.ok()
                .entity(CityDto.from(city))
                .build();
    }

    @GET
    @Path("count-by-sea-level")
    public Response countBySeaLevel(@QueryParam("metersAboveSeaLevel") @DefaultValue("0") double meters) {
        long count = service.getCitiesCountBySeaLevel(meters);

        return Response.ok()
                .entity(count)
                .build();
    }

    @GET
    @Path("cities-higher")
    public Response citiesHigher(@QueryParam("metersAboveSeaLevel") @DefaultValue("0") double meters) {
        List<City> cities = service.getCitiesWhereMetersAboveSeaLevelIsHigherThan(meters);

        List<CityDto> dtos = cities.stream().map(CityDto::from).toList();
        return Response.ok()
                .entity(dtos)
                .build();
    }

    @GET
    @Path("calculate-dist-to-smallest")
    public Response calculateDistToSmallest() {
        double dist = service.calculateDistToSmallestCity();

        return Response.ok()
                .entity(dist)
                .build();
    }

    @GET
    @Path("calculate-dist-to-biggest")
    public Response calculateDistToBiggest(
            @QueryParam("x0") @DefaultValue("0") double x0,
            @QueryParam("y0") @DefaultValue("0") double y0,
            @QueryParam("z0") @DefaultValue("0") double z0) {
        double dist = service.calculateDistToBiggestCity(x0, y0, z0);

        return Response.ok()
                .entity(dist)
                .build();
    }
}
