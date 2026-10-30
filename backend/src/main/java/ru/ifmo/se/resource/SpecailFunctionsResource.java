package ru.ifmo.se.resource;

import java.util.List;

import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import ru.ifmo.se.dto.CityDto;
import ru.ifmo.se.model.City;
import ru.ifmo.se.service.SpecialFunctionsService;

@Path("cities/manage")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
public class SpecailFunctionsResource {
    @Inject
    private SpecialFunctionsService service;

    @GET
    @Path("min-telephone-code")
    @APIResponse(
        responseCode = "200",
        description = "Select city by minimal telephone code",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = CityDto.class)
        )
    )
    public Response minTelephoneCode() {
        City city = service.selectCityByMinTelephoneCode();

        return Response.ok()
            .entity(CityDto.from(city))
            .build();
    }

    @GET
    @Path("count-by-sea-level")
    @APIResponse(
        responseCode = "200",
        description = "Get count of citires with provided meters above sea level",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = Integer.class)
        )
    )
    public Response countBySeaLevel(@QueryParam("metersAboveSeaLevel") @DefaultValue("0") double meters) {
        long count = service.getCitiesCountBySeaLevel(meters);

        return Response.ok()
            .entity(count)
            .build();
    }

    @GET
    @Path("cities-higher")
    @APIResponse(
        responseCode = "200",
        description = "Get cities where meters above sea level is higher than provided one",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(
                type = SchemaType.ARRAY,
                implementation = CityDto.class
            )
        )
    )
    public Response citiesHigher(@QueryParam("metersAboveSeaLevel") @DefaultValue("0") double meters) {
        List<City> cities = service.getCitiesWhereMetersAboveSeaLevelIsHigherThan(meters);

        List<CityDto> dtos = cities.stream().map(CityDto::from).toList();
        return Response.ok()
            .entity(dtos)
            .build();
    }

    @GET
    @Path("calculate-dist-to-smallest")
    @APIResponse(
        responseCode = "200",
        description = "Calculate distance to smallest city",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = Double.class)
        )
    )
    public Response calculateDistToSmallest() {
        double dist = service.calculateDistToSmallestCity();

        return Response.ok()
            .entity(dist)
            .build();
    }

    @GET
    @Path("calculate-dist-to-biggest")
    @APIResponse(
        responseCode = "200",
        description = "Calculate distance to biggest city",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = Double.class)
        )
    )
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
