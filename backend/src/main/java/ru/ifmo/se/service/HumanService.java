package ru.ifmo.se.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import ru.ifmo.se.dto.CreateHumanDto;
import ru.ifmo.se.dto.UpdateHumanDto;
import ru.ifmo.se.model.Human;
import ru.ifmo.se.repository.HumanRepository;

@Named
@ApplicationScoped
public class HumanService {

    @Inject
    HumanRepository repository;

    public Human getHumanById(int id) {
        return repository.findById(id).orElseThrow();
    }

    @Transactional
    public Human createHuman(CreateHumanDto dto) {
        Human human = Human.builder()
                .name(dto.getName())
                .birthday(dto.getBirthday())
                .build();

        human = repository.insert(human);
        return human;
    }

    @Transactional
    public Human updateHumanById(int id, UpdateHumanDto dto) {
        Human human = repository.findById(id).orElseThrow();

        if (dto.getName() != null) {
            human.setName(dto.getName());
        }

        if (dto.getAnnulateBirthday() != null && dto.getAnnulateBirthday()) {
            human.setBirthday(null);
        } else {
            if (dto.getBirthday() != null) {
                human.setBirthday(dto.getBirthday());
            }
        }

        human = repository.update(human);

        return human;
    }
}
