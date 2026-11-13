package ru.ifmo.se.repository;

import jakarta.data.Order;
import jakarta.data.page.Page;
import jakarta.data.page.PageRequest;
import jakarta.data.repository.CrudRepository;
import jakarta.data.repository.Param;
import jakarta.data.repository.Query;
import jakarta.data.repository.Repository;
import ru.ifmo.se.model.ImportCityHistory;

@Repository
public interface ImportCityHistoryRepository extends CrudRepository<ImportCityHistory, Integer> {
    @Query("WHERE userLogin = :login")
    Page<ImportCityHistory> findByUserLogin(@Param("login") String login, PageRequest pageRequest,
        Order<ImportCityHistory> order);
}
