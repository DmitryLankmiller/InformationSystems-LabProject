package ru.ifmo.se.service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import jakarta.transaction.Transactional.TxType;
import ru.ifmo.se.dto.csv.ImportCityDto;
import ru.ifmo.se.dto.csv.ImportCityParser;
import ru.ifmo.se.exception.ImportDataException;
import ru.ifmo.se.model.City;
import ru.ifmo.se.model.Coordinates;
import ru.ifmo.se.model.Human;
import ru.ifmo.se.repository.CityRepository;
import ru.ifmo.se.repository.CoordinatesRepository;
import ru.ifmo.se.repository.HumanRepository;

@Named
@ApplicationScoped
public class ImportCityExecutor {
    @Inject
    private CityRepository cityRepository;
    @Inject
    private CoordinatesRepository coordinatesRepository;
    @Inject
    private HumanRepository humanRepository;
    @Inject
    private ImportCityParser parser;

    private Coordinates createRawCoordinates(ImportCityDto dto) {
        return Coordinates.builder()
            .x(dto.getCoordinatesX())
            .y(dto.getCoordinatesY())
            .build();
    }

    private Human getOrCreateRawHuman(ImportCityDto dto) {
        return dto.getGovernorId() != null ? humanRepository.findById(dto.getGovernorId()).orElseThrow()
            : Human.builder()
                .name(dto.getGovernorName())
                .birthday(dto.getGovernorBirthday())
                .build();
    }

    private City createRawCity(ImportCityDto dto) {
        return City.builder()
            .name(dto.getName())
            .area(dto.getArea())
            .population(dto.getPopulation())
            .establishmentDate(dto.getEstablishmentDate())
            .capital(dto.getCapital())
            .metersAboveSeaLevel(dto.getMetersAboveSeaLevel())
            .telephoneCode(dto.getTelephoneCode())
            .climate(dto.getClimate())
            .standardOfLiving(dto.getStandardOfLiving())
            .build();
    }

    @Transactional(value = TxType.REQUIRES_NEW)
    public int executeImport(InputStream in, int historyId) {
        List<ImportCityDto> dtos;
        try {
            dtos = parser.parseInputCsv(in);
        } catch (RuntimeException e) { // bad input data
            throw new ImportDataException();
        }
        List<Coordinates> coordinates = new ArrayList<>();
        List<Human> governors = new ArrayList<>();
        List<City> cities = new ArrayList<>();

        for (ImportCityDto dto : dtos) {
            coordinates.add(createRawCoordinates(dto));
            governors.add(getOrCreateRawHuman(dto));
            cities.add(createRawCity(dto));
        }

        try {
            coordinates = coordinatesRepository.saveAll(coordinates);
            governors = humanRepository.saveAll(governors);

            for (int i = 0; i < cities.size(); ++i) {
                cities.get(i).setCoordinates(coordinates.get(i));
                cities.get(i).setGovernor(governors.get(i));
            }

            cities = cityRepository.saveAll(cities);
            return cities.size();
        } catch (RuntimeException e) { // db or constraines errors
            throw new ImportDataException();
        }
    }
}
