package ru.ifmo.se.repository;

import jakarta.data.repository.CrudRepository;
import jakarta.data.repository.Repository;
import ru.ifmo.se.model.ImportCityHistory;

@Repository
public interface ImportCityHistoryRepository extends CrudRepository<ImportCityHistory, Integer> {
}
