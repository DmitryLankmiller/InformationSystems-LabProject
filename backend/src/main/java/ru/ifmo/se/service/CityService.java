package ru.ifmo.se.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import jakarta.data.Order;
import jakarta.data.Sort;
import jakarta.data.page.Page;
import jakarta.data.page.PageRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import ru.ifmo.se.dto.CreateCityDto;
import ru.ifmo.se.dto.PageResponse;
import ru.ifmo.se.dto.UpdateCityDto;
import ru.ifmo.se.model.City;
import ru.ifmo.se.model.Coordinates;
import ru.ifmo.se.model.Human;
import ru.ifmo.se.repository.CityRepository;

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

        if (dto.getName() != null) {
            city.setName(dto.getName());
        }

        if (dto.getCoordinates() != null) {
            coordinatesService.updateCoordinatesById(city.getCoordinates().getId(), dto.getCoordinates());
        }

        if (dto.getArea() != null) {
            city.setArea(dto.getArea());
        }

        if (dto.getPopulation() != null) {
            city.setPopulation(dto.getPopulation());
        }

        if (dto.getAnnulateEstablishmentDate() != null && dto.getAnnulateEstablishmentDate()) {
            city.setEstablishmentDate(null);
        } else {
            if (dto.getEstablishmentDate() != null) {
                city.setEstablishmentDate(dto.getEstablishmentDate());
            }
        }

        if (dto.getCapital() != null) {
            city.setCapital(dto.getCapital());
        }

        if (dto.getAnnulateMetersAboveSeaLevel() != null && dto.getAnnulateMetersAboveSeaLevel()) {
            city.setMetersAboveSeaLevel(null);
        } else {
            if (dto.getMetersAboveSeaLevel() != null) {
                city.setMetersAboveSeaLevel(dto.getMetersAboveSeaLevel());
            }
        }

        if (dto.getAnnulateTelephoneCode() != null && dto.getAnnulateTelephoneCode()) {
            city.setTelephoneCode(null);
        } else {
            if (dto.getTelephoneCode() != null) {
                city.setTelephoneCode(dto.getTelephoneCode());
            }
        }

        if (dto.getAnnulateClimate() != null && dto.getAnnulateClimate()) {
            city.setClimate(null);
        } else {
            if (dto.getClimate() != null) {
                city.setClimate(dto.getClimate());
            }
        }

        if (dto.getAnnulateStandardOfLiving() != null && dto.getAnnulateStandardOfLiving()) {
            city.setStandardOfLiving(null);
        } else {
            if (dto.getStandardOfLiving() != null) {
                city.setStandardOfLiving(dto.getStandardOfLiving());
            }
        }

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

    private String prepareSortField(String fieldName) {
        return fieldName.equals("governorName") ? "governor.name" : fieldName;
    }

    private Order<City> prepareOrder(String sort) {
        List<Sort<? super City>> sorts = new ArrayList<>();

        if (sort != null) {
            for (String rule : sort.split(",")) {
                var rules = rule.split(":");
                if (rules.length != 2) {
                    continue;
                }

                String fieldName = rules[0], direction = rules[1];

                if (!ORDER_FIELDS.contains(fieldName)) {
                    continue;
                }

                switch (direction) {
                    case "asc" :
                        sorts.add(Sort.asc(prepareSortField(fieldName)));
                        break;
                    case "desc" :
                        sorts.add(Sort.desc(prepareSortField(fieldName)));
                        break;
                    default :
                        continue;
                }
            }
        }

        // sorts.add(Sort.asc("id"));

        return Order.by(sorts);
    }

    public PageResponse<City> getCities(
        int page, int size,
        String nameFilter, String governorNameFilter,
        String sort) {

        PageRequest pageRequest = PageRequest.ofPage(page, size, true);

        Page<City> cities = repository.findCities(
            prepareFilterParam(nameFilter),
            prepareFilterParam(governorNameFilter),
            prepareOrder(sort),
            pageRequest);

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
