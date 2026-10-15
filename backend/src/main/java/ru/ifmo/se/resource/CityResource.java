package ru.ifmo.se.resource;

import java.net.URI;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import ru.ifmo.se.dto.CityDto;
import ru.ifmo.se.dto.CreateCityDto;
import ru.ifmo.se.dto.UpdateCityDto;
import ru.ifmo.se.model.City;
import ru.ifmo.se.service.CityService;

@Path("cities")
@RequestScoped
public class CityResource {

    @Inject
    private CityService service;

    @GET
    @Path("{id}")
    public Response getCityById(@PathParam("id") long id) {
        City city = service.getCityById(id);

        return Response.ok()
                .entity(CityDto.from(city))
                .build();
    }

    @POST
    public Response createCity(@Valid CreateCityDto dto, @Context UriInfo uriInfo) {
        City city = service.createCity(dto);

        URI uri = uriInfo.getAbsolutePathBuilder()
                .path(Long.toString(city.getId()))
                .build();

        return Response.created(uri)
                .entity(CityDto.from(city))
                .build();
    }

    @DELETE
    @Path("{id}")
    public Response deleteCityById(@PathParam("id") long id) {
        if (service.deleteCityById(id)) {
            return Response.noContent()
                    .build();
        }

        return Response.status(Response.Status.CONFLICT)
                .build();
    }

    @PATCH
    @Path("{id}")
    public Response updateCityById(@PathParam("id") long id, @Valid UpdateCityDto dto) {
        City city = service.updateCityById(id, dto);

        return Response.ok()
                .entity(CityDto.from(city))
                .build();
    }

}