package ru.ifmo.se.repository;

import jakarta.data.repository.CrudRepository;
import jakarta.data.repository.Repository;
import ru.ifmo.se.model.User;

@Repository
public interface UserRepository extends CrudRepository<User, Integer> {
}
