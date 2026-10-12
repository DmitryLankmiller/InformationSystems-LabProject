package ru.ifmo.se.repository;

import jakarta.data.repository.CrudRepository;
import jakarta.data.repository.Repository;
import ru.ifmo.se.model.Coordinates;

@Repository
public interface CoordinatesRepository extends CrudRepository<Coordinates, Integer> {

}
