package ru.ifmo.se.resource;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.EntityPart;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import ru.ifmo.se.dto.response.ImportCityHistoryDto;
import ru.ifmo.se.model.ImportCityHistory;
import ru.ifmo.se.service.ImportCityService;
import ru.ifmo.se.service.ImportHistoryService;

@Path("import")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
public class ImportCityResource {
    private static final Logger LOGGER = Logger.getLogger(ImportCityResource.class.getName());

    @Inject
    private ImportCityService importService;
    @Inject
    private ImportHistoryService historyService;

    @GET
    @Path("history/{id}")
    public Response getImportHistoryById(@PathParam("id") @NotNull @Positive Integer id) {
        ImportCityHistory history = historyService.getImportHistoryById(id);

        return Response.ok()
            .entity(ImportCityHistoryDto.from(history))
            .build();
    }

    @POST
    @Path("accept")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response acceptImportTask(@FormParam("import_csv") @NotNull EntityPart entityPart) {
        ImportCityHistory history = null;
        try (InputStream in = entityPart.getContent()) {
            history = importService.acceptImport(in,
                entityPart.getFileName().orElseGet(() -> "new-import-%s".formatted(UUID.randomUUID().toString())));
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, "Не удалось закрыть поток загруженного CSV-файла.", e);
        }
        return Response.accepted()
            .entity(ImportCityHistoryDto.from(history))
            .build();
    }
}
