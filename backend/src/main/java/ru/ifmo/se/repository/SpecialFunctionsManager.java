package ru.ifmo.se.repository;

import java.util.List;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import ru.ifmo.se.model.City;

@Named
@ApplicationScoped
public class SpecialFunctionsManager {
    @PersistenceContext(unitName = "city-PU")
    private EntityManager em;

    public City selectAnyCityWithMinTelephoneCode() {
        return (City) em.createNativeQuery("SELECT * FROM select_any_city_with_min_telephone_code()", City.class)
                .getSingleResult();
    }

    public Long getCitiesCountByMetersAboveSeaLevel(double metersAboveSeaLevel) {
        return (Long) em.createNativeQuery("SELECT get_cities_count_by_meters_above_sea_level(?)")
                .setParameter(1, metersAboveSeaLevel)
                .getSingleResult();
    }

    public List<City> getCitiesWhereMetersAboveSeaLevelIsHigherThan(double metersAboveSeaLevel) {
        List<?> l = em
                .createNativeQuery("SELECT * FROM get_cities_where_meters_above_sea_level_is_higher_than(?)",
                        City.class)
                .setParameter(1, metersAboveSeaLevel)
                .getResultList();
        return (List<City>) l.stream().map(City.class::cast).toList();
    }

    public Double calculateDistFromStartToSmallestCity() {
        return (Double) em.createNativeQuery("SELECT calculate_dist_from_start_to_smallest_city()")
                .getSingleResult();
    }

    public Double calculateDistToBiggestCity(double x0, double y0, double z0) {
        return (Double) em.createNativeQuery("SELECT calculate_dist_to_biggest_city(?, ?, ?)")
                .setParameter(1, x0)
                .setParameter(2, y0)
                .setParameter(3, z0)
                .getSingleResult();
    }

}
