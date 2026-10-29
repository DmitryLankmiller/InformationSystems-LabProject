package ru.ifmo.se.repository;

import jakarta.data.Order;
import jakarta.data.page.Page;
import jakarta.data.page.PageRequest;
import jakarta.data.repository.CrudRepository;
import jakarta.data.repository.Param;
import jakarta.data.repository.Query;
import jakarta.data.repository.Repository;
import ru.ifmo.se.model.City;

@Repository
public interface CityRepository extends CrudRepository<City, Long> {
    boolean existsById(long id);

    @Query("WHERE name LIKE :namePattern ESCAPE '!' AND governor.name LIKE :governorNamePattern ESCAPE '!'")
    Page<City> findCities(@Param("namePattern") String namePattern,
        @Param("governorNamePattern") String governorNamePattern,
        Order<City> order, PageRequest pageRequest);
}
