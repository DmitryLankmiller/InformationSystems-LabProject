package ru.ifmo.se.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import ru.ifmo.se.dto.request.CreateHumanDto;
import ru.ifmo.se.dto.request.UpdateHumanDto;
import ru.ifmo.se.model.Human;
import ru.ifmo.se.repository.HumanRepository;
import ru.ifmo.se.utils.PatchManager;

@Named
@ApplicationScoped
public class HumanService {
    @Inject
    HumanRepository repository;
    @Inject
    private PatchManager patchManager;

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

        patchManager.applyPatch(dto, human);

        human = repository.update(human);

        return human;
    }
}
