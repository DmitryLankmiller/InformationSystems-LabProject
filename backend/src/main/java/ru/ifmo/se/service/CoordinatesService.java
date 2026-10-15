package ru.ifmo.se.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import ru.ifmo.se.dto.CreateCoordinatesDto;
import ru.ifmo.se.dto.UpdateCoordinatesDto;
import ru.ifmo.se.model.Coordinates;
import ru.ifmo.se.repository.CoordinatesRepository;

@Named
@ApplicationScoped
public class CoordinatesService {
    @Inject
    CoordinatesRepository repository;

    public Coordinates getCoordinatesById(int id) {
        return repository.findById(id).orElseThrow();
    }

    @Transactional
    public Coordinates createCoordinates(CreateCoordinatesDto dto) {
        Coordinates coordinates = Coordinates.builder()
                .x(dto.getX())
                .y(dto.getY())
                .build();

        coordinates = repository.insert(coordinates);
        return coordinates;
    }

    @Transactional
    public Coordinates updateCoordinatesById(int id, UpdateCoordinatesDto dto) {
        Coordinates coordinates = repository.findById(id).orElseThrow();

        if (dto.getX() != null) {
            coordinates.setX(dto.getX());
        }

        if (dto.getY() != null) {
            coordinates.setY(dto.getY());
        }

        coordinates = repository.update(coordinates);

        return coordinates;
    }

}
