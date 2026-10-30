package ru.ifmo.se.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import ru.ifmo.se.dto.request.CreateCityDto;
import ru.ifmo.se.dto.request.UpdateCityDto;
import ru.ifmo.se.dto.response.PageResponse;
import ru.ifmo.se.model.City;
import ru.ifmo.se.model.Coordinates;
import ru.ifmo.se.model.Human;
import ru.ifmo.se.repository.CityRepository;
import ru.ifmo.se.repository.search.CitySearchRepository;
import ru.ifmo.se.repository.search.CitySortField;
import ru.ifmo.se.repository.search.SearchPage;
import ru.ifmo.se.repository.search.SortRule;
import ru.ifmo.se.utils.PatchManager;

@Named
@ApplicationScoped
public class CityService {
    private static final Set<String> ORDER_FIELDS = Set.of("name", "governorName");

    @Inject
    private CityRepository repository;
    @Inject
    private CoordinatesService coordinatesService;
    @Inject
    private HumanService humanService;
    @Inject
    private CitySearchRepository searchRepository;
    @Inject
    private PatchManager patchManager;

    @Transactional
    public City createCity(CreateCityDto dto) {

        Coordinates coordinates = coordinatesService.createCoordinates(dto.getCoordinates());

        Human governor;
        if (dto.getGovernorId() == null) {
            governor = humanService.createHuman(dto.getGovernor());
        } else {
            governor = humanService.getHumanById(dto.getGovernorId());
        }

        City city = City.builder()
            .name(dto.getName())
            .coordinates(coordinates)
            .area(dto.getArea())
            .population(dto.getPopulation())
            .establishmentDate(dto.getEstablishmentDate())
            .capital(dto.getCapital())
            .metersAboveSeaLevel(dto.getMetersAboveSeaLevel())
            .telephoneCode(dto.getTelephoneCode())
            .climate(dto.getClimate())
            .standardOfLiving(dto.getStandardOfLiving())
            .governor(governor)
            .build();

        city = repository.insert(city);

        return city;
    }

    public City getCityById(long id) {
        return repository.findById(id).orElseThrow();
    }

    @Transactional
    public boolean deleteCityById(long id) {
        if (!repository.existsById(id)) {
            return false;
        }

        repository.deleteById(id);
        return true;
    }

    @Transactional
    public City updateCityById(long id, UpdateCityDto dto) {
        City city = repository.findById(id).orElseThrow();

        if (dto.getCoordinates() != null) {
            coordinatesService.updateCoordinatesById(city.getCoordinates().getId(), dto.getCoordinates());
        }

        patchManager.applyPatch(dto, city);

        city = repository.update(city);

        return city;
    }

    private String prepareFilterParam(String filter) {
        return filter == null
            ? "%"
            : "%" + filter
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_")
                + "%";
    }

    private CitySortField prepareSortField(String fieldName) {
        if ("governorName".equals(fieldName)) {
            return CitySortField.GOVERNOR_NAME;
        }
        if ("name".equals(fieldName)) {
            return CitySortField.NAME;
        }
        throw new IllegalArgumentException("wrong sort field");
    }

    private List<SortRule> prepareOrder(String sort) {
        List<SortRule> sorting = new ArrayList<>();

        if (sort == null) {
            return sorting;
        }

        for (String rule : sort.split(",")) {
            var rules = rule.split(":");
            if (rules.length != 2) {
                continue;
            }

            String fieldName = rules[0], direction = rules[1];

            if (!ORDER_FIELDS.contains(fieldName)) {
                continue;
            }

            if (!"asc".equals(direction) && !"desc".equals(direction)) {
                continue;
            }

            sorting.add(new SortRule(prepareSortField(fieldName), "asc".equals(direction)));
        }

        return sorting;

    }

    public PageResponse<City> getCities(
        int page, int size,
        String nameFilter, String governorNameFilter,
        String sort) {

        SearchPage<City> cities = searchRepository.search(
            prepareFilterParam(nameFilter),
            prepareFilterParam(governorNameFilter),
            prepareOrder(sort),
            page,
            size);

        return PageResponse.<City>builder()
            .page(page)
            .size(size)
            .hasNext(cities.hasNext())
            .totalPages(cities.totalPages())
            .totalElements(cities.totalElements())
            .content(cities.content())
            .build();
    }

}
