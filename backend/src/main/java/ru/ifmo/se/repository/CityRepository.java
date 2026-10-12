package ru.ifmo.se.repository;

import jakarta.data.repository.CrudRepository;
import jakarta.data.repository.Repository;
import ru.ifmo.se.model.City;

@Repository
public interface CityRepository extends CrudRepository<City, Long> {

}
