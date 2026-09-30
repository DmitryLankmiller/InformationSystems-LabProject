package ru.ifmo.se.resource;

import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import ru.ifmo.se.dto.StatusObject;

@Path("health")
@RequestScoped
public class HealthResource {

    @PersistenceContext(unitName = "city-PU")
    private EntityManager em;

    @GET
    @Path("check")
    public StatusObject healthCheck() {
        return new StatusObject("ok", "System is health");
    }

    @GET
    @Path("db/check")
    @Transactional
    public StatusObject dbCheck() {
        try {
            em.createNativeQuery("SELECT 1;").getSingleResult();
            return new StatusObject("ok", "Connection to DB is successful");
        } catch (RuntimeException e) {
            return new StatusObject("not ok", e.getMessage());
        }
    }

}
