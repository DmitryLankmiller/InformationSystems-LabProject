package ru.ifmo.se.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import ru.ifmo.se.dto.CreateCityDto;
import ru.ifmo.se.dto.UpdateCityDto;
import ru.ifmo.se.model.City;
import ru.ifmo.se.model.Coordinates;
import ru.ifmo.se.model.Human;
import ru.ifmo.se.repository.CityRepository;

@Named
@ApplicationScoped
public class CityService {
    @Inject
    private CityRepository repository;
    @Inject
    private CoordinatesService coordinatesService;
    @Inject
    private HumanService humanService;

    @Transactional
    public City createCity(CreateCityDto dto) {

        Coordinates coordinates = coordinatesService.createCoordinates(dto.getCoordinates());

        Human governor;
        if (dto.getGovernorId() == null) {
            governor = humanService.createHuman(dto.getGovernor());
        } else {
            governor = humanService.getHumanById(dto.getGovernorId());
        }

        City city = City.builder()
                .name(dto.getName())
                .coordinates(coordinates)
                .area(dto.getArea())
                .population(dto.getPopulation())
                .establishmentDate(dto.getEstablishmentDate())
                .capital(dto.getCapital())
                .metersAboveSeaLevel(dto.getMetersAboveSeaLevel())
                .telephoneCode(dto.getTelephoneCode())
                .climate(dto.getClimate())
                .standardOfLiving(dto.getStandardOfLiving())
                .governor(governor)
                .build();

        city = repository.insert(city);

        return city;
    }

    public City getCityById(long id) {
        return repository.findById(id).orElseThrow();
    }

    @Transactional
    public boolean deleteCityById(long id) {
        if (!repository.existsById(id)) {
            return false;
        }

        repository.deleteById(id);
        return true;
    }

    @Transactional
    public City updateCityById(long id, UpdateCityDto dto) {
        City city = repository.findById(id).orElseThrow();

        if (dto.getName() != null) {
            city.setName(dto.getName());
        }

        if (dto.getCoordinates() != null) {
            coordinatesService.updateCoordinatesById(city.getCoordinates().getId(), dto.getCoordinates());
        }

        if (dto.getArea() != null) {
            city.setArea(dto.getArea());
        }

        if (dto.getPopulation() != null) {
            city.setPopulation(dto.getPopulation());
        }

        if (dto.getAnnulateEstablishmentDate() != null && dto.getAnnulateEstablishmentDate()) {
            city.setEstablishmentDate(null);
        } else {
            if (dto.getEstablishmentDate() != null) {
                city.setEstablishmentDate(dto.getEstablishmentDate());
            }
        }

        if (dto.getCapital() != null) {
            city.setCapital(dto.getCapital());
        }

        if (dto.getAnnulateMetersAboveSeaLevel() != null && dto.getAnnulateMetersAboveSeaLevel()) {
            city.setMetersAboveSeaLevel(null);
        } else {
            if (dto.getMetersAboveSeaLevel() != null) {
                city.setMetersAboveSeaLevel(dto.getMetersAboveSeaLevel());
            }
        }

        if (dto.getAnnulateTelephoneCode() != null && dto.getAnnulateTelephoneCode()) {
            city.setTelephoneCode(null);
        } else {
            if (dto.getTelephoneCode() != null) {
                city.setTelephoneCode(dto.getTelephoneCode());
            }
        }

        if (dto.getAnnulateClimate() != null && dto.getAnnulateClimate()) {
            city.setClimate(null);
        } else {
            if (dto.getClimate() != null) {
                city.setClimate(dto.getClimate());
            }
        }

        if (dto.getAnnulateStandardOfLiving() != null && dto.getAnnulateStandardOfLiving()) {
            city.setStandardOfLiving(null);
        } else {
            if (dto.getStandardOfLiving() != null) {
                city.setStandardOfLiving(dto.getStandardOfLiving());
            }
        }

        city = repository.update(city);

        return city;
    }

}
