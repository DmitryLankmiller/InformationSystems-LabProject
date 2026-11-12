package ru.ifmo.se.dto.csv;

import java.io.InputStream;
import java.util.List;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import jakarta.validation.Valid;
import tools.jackson.dataformat.csv.CsvMapper;
import tools.jackson.dataformat.csv.CsvReadFeature;
import tools.jackson.dataformat.csv.CsvSchema;

@Named
@ApplicationScoped
public class ImportCityParser {
    private final CsvMapper mapper;

    public ImportCityParser() {
        mapper = CsvMapper.builder()
            .enable(CsvReadFeature.WRAP_AS_ARRAY)
            .build();
    }

    public List<@Valid ImportCityDto> parseInputCsv(InputStream inputCsv) {
        var schema = CsvSchema.emptySchema().withHeader();
        var reader = mapper.readerForListOf(ImportCityDto.class).with(schema);
        List<ImportCityDto> all = reader.readValue(inputCsv);
        return all;
    }
}
