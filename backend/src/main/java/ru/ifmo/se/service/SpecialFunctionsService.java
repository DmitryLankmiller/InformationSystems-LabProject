package ru.ifmo.se.service;

import java.util.List;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import ru.ifmo.se.model.City;
import ru.ifmo.se.repository.SpecialFunctionsManager;

@Named
@ApplicationScoped
public class SpecialFunctionsService {

    @Inject
    private SpecialFunctionsManager manager;

    public City selectCityByMinTelephoneCode() {
        return manager.selectAnyCityWithMinTelephoneCode();
    }

    public Long getCitiesCountBySeaLevel(double metersAboveSeaLevel) {
        return manager.getCitiesCountByMetersAboveSeaLevel(metersAboveSeaLevel);
    }

    public List<City> getCitiesWhereMetersAboveSeaLevelIsHigherThan(double metersAboveSeaLevel) {
        return manager.getCitiesWhereMetersAboveSeaLevelIsHigherThan(metersAboveSeaLevel);
    }

    public Double calculateDistToSmallestCity() {
        return manager.calculateDistFromStartToSmallestCity();
    }

    public Double calculateDistToBiggestCity(double x0, double y0, double z0) {
        return manager.calculateDistToBiggestCity(x0, y0, z0);
    }

}
