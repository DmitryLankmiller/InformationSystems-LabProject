package ru.ifmo.se.repository;

import jakarta.data.repository.CrudRepository;
import jakarta.data.repository.Repository;
import ru.ifmo.se.model.Human;

@Repository
public interface HumanRepository extends CrudRepository<Human, Integer> {

}
