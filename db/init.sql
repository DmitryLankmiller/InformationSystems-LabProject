CREATE TABLE
    IF NOT EXISTS coordinates (
        id SERIAL PRIMARY KEY,
        x INTEGER NOT NULL CHECK (x <= 434),
        y REAL NOT NULL,
        CONSTRAINT unique_coordinates UNIQUE (x, y)
    );

CREATE TABLE
    IF NOT EXISTS human (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL CHECK (name <> ''),
        birthday TIMESTAMPTZ
    );

CREATE TYPE climate_enum AS ENUM ('RAIN_FOREST', 'HUMIDSUBTROPICAL', 'SUBARCTIC');

CREATE TYPE standard_of_living_enum AS ENUM ('HIGH', 'MEDIUM', 'VERY_LOW', 'NIGHTMARE');

CREATE TABLE
    IF NOT EXISTS city (
        id BIGSERIAL PRIMARY KEY CHECK (id > 0),
        name TEXT NOT NULL CHECK (name <> ''),
        coordinates_id INTEGER NOT NULL UNIQUE REFERENCES coordinates,
        creation_date TIMESTAMP NOT NULL DEFAULT NOW (),
        area REAL NOT NULL CHECK (area > 0),
        population INTEGER NOT NULL CHECK (population > 0),
        establishment_date TIMESTAMPTZ,
        capital BOOLEAN NOT NULL,
        meters_above_sea_level DOUBLE PRECISION,
        telephone_code BIGINT CHECK (
            telephone_code > 0
            AND telephone_code <= 100000
        ),
        climate climate_enum,
        standard_of_living standard_of_living_enum,
        governor_id INTEGER NOT NULL REFERENCES human
    );