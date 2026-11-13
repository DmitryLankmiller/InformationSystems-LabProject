package ru.ifmo.se.service;

import java.io.InputStream;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import jakarta.transaction.Transactional.TxType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.ElementKind;
import ru.ifmo.se.dto.csv.ImportCityDto;
import ru.ifmo.se.dto.csv.ImportCityParser;
import ru.ifmo.se.exception.ImportDataException;
import ru.ifmo.se.model.City;
import ru.ifmo.se.model.Coordinates;
import ru.ifmo.se.model.Human;
import ru.ifmo.se.repository.CityRepository;
import ru.ifmo.se.repository.CoordinatesRepository;
import ru.ifmo.se.repository.HumanRepository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.exc.InvalidFormatException;

@Named
@ApplicationScoped
public class ImportCityExecutor {
    @Inject
    private CityRepository cityRepository;
    @Inject
    private CoordinatesRepository coordinatesRepository;
    @Inject
    private HumanRepository humanRepository;
    @Inject
    private ImportCityParser parser;

    private Coordinates createRawCoordinates(ImportCityDto dto) {
        return Coordinates.builder()
            .x(dto.getCoordinatesX())
            .y(dto.getCoordinatesY())
            .build();
    }

    private Human getOrCreateRawHuman(ImportCityDto dto, int record) {
        return dto.getGovernorId() != null ? humanRepository.findById(dto.getGovernorId())
            .orElseThrow(() -> new ImportDataException(
                "Запись %d, поле «governor_id»: губернатор с ID %d не найден."
                    .formatted(record, dto.getGovernorId())))
            : Human.builder()
                .name(dto.getGovernorName())
                .birthday(dto.getGovernorBirthday())
                .build();
    }

    private City createRawCity(ImportCityDto dto) {
        return City.builder()
            .name(dto.getName())
            .area(dto.getArea())
            .population(dto.getPopulation())
            .establishmentDate(dto.getEstablishmentDate())
            .capital(dto.getCapital())
            .metersAboveSeaLevel(dto.getMetersAboveSeaLevel())
            .telephoneCode(dto.getTelephoneCode())
            .climate(dto.getClimate())
            .standardOfLiving(dto.getStandardOfLiving())
            .build();
    }

    @Transactional(value = TxType.REQUIRES_NEW)
    public int executeImport(InputStream in, int historyId) {
        List<ImportCityDto> dtos;
        try {
            dtos = parser.parseInputCsv(in);
        } catch (ConstraintViolationException e) {
            String message = e.getConstraintViolations().stream()
                .map(this::validationMessage)
                .sorted()
                .collect(Collectors.joining(" "));
            throw new ImportDataException(message, e);
        } catch (JacksonException e) {
            throw new ImportDataException(csvMessage(e), e);
        }
        List<Coordinates> coordinates = new ArrayList<>();
        List<Human> governors = new ArrayList<>();
        List<City> cities = new ArrayList<>();

        for (int i = 0; i < dtos.size(); i++) {
            ImportCityDto dto = dtos.get(i);
            coordinates.add(createRawCoordinates(dto));
            governors.add(getOrCreateRawHuman(dto, i + 1));
            cities.add(createRawCity(dto));
        }

        coordinates = coordinatesRepository.saveAll(coordinates);
        governors = humanRepository.saveAll(governors);

        for (int i = 0; i < cities.size(); ++i) {
            cities.get(i).setCoordinates(coordinates.get(i));
            cities.get(i).setGovernor(governors.get(i));
        }

        return cityRepository.saveAll(cities).size();
    }

    private String validationMessage(ConstraintViolation<?> violation) {
        int record = 0;
        String property = null;
        for (var node : violation.getPropertyPath()) {
            if (node.getIndex() != null) {
                record = node.getIndex() + 1;
            }
            if (node.getKind() == ElementKind.PROPERTY) {
                property = node.getName();
            }
        }
        String prefix = record > 0 ? "Запись %d, ".formatted(record) : "";
        return prefix + "поле «%s»: %s".formatted(csvColumn(property), violation.getMessage());
    }

    private String csvColumn(String property) {
        if (property == null) {
            return "запись";
        }
        if (property.equals("governorProvided")) {
            return "governor_id / governor_name";
        }
        try {
            var annotation = ImportCityDto.class.getDeclaredField(property).getAnnotation(JsonProperty.class);
            return annotation == null ? property : annotation.value();
        } catch (NoSuchFieldException e) {
            return property;
        }
    }

    private String csvMessage(JacksonException exception) {
        String prefix = "";
        for (var reference : exception.getPath()) {
            if (reference.getIndex() >= 0) {
                prefix += "Запись %d, ".formatted(reference.getIndex() + 1);
            }
            if (reference.getPropertyName() != null) {
                prefix += "поле «%s»: ".formatted(reference.getPropertyName());
            }
        }
        if (prefix.isEmpty() && exception.getLocation() != null && exception.getLocation().getLineNr() > 0) {
            prefix = "Строка файла %d: ".formatted(exception.getLocation().getLineNr());
        }
        if (exception instanceof InvalidFormatException invalid) {
            Class<?> type = invalid.getTargetType();
            if (type != null && type.isEnum()) {
                return prefix + "допустимые значения: " + Arrays.stream(type.getEnumConstants())
                    .map(Object::toString).collect(Collectors.joining(", ")) + ".";
            }
            if (type == Integer.class || type == Long.class) {
                return prefix + "ожидалось целое число.";
            }
            if (type == Float.class || type == Double.class) {
                return prefix + "ожидалось число.";
            }
            if (type == Boolean.class) {
                return prefix + "ожидалось true или false.";
            }
            if (type == ZonedDateTime.class) {
                return prefix + "ожидались дата и время с часовым поясом в формате ISO 8601.";
            }
        }
        return prefix + "не удалось разобрать CSV. Проверьте заголовок, значения и кавычки.";
    }
}
