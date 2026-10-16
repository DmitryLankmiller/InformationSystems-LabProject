/* BUISNESS-LOGIC FUNCTIONS */
CREATE OR REPLACE FUNCTION select_any_city_with_min_telephone_code() RETURNS SETOF city LANGUAGE sql AS $$
SELECT c.*
FROM city c
ORDER BY c.telephone_code
LIMIT 1 $$;

CREATE OR REPLACE FUNCTION get_cities_count_by_meters_above_sea_level(val DOUBLE PRECISION) RETURNS BIGINT LANGUAGE sql AS $$
SELECT COUNT(*)
FROM city
WHERE meters_above_sea_level = val $$;

CREATE OR REPLACE FUNCTION get_cities_where_meters_above_sea_level_is_higher_than(val DOUBLE PRECISION) RETURNS SETOF city AS $$
BEGIN RETURN QUERY
SELECT *
FROM city
WHERE meters_above_sea_level > val;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_dist_from_start_to_smallest_city() RETURNS DOUBLE PRECISION AS $$
DECLARE
smallest_city_id BIGINT;
pos_z DOUBLE PRECISION;
coords coordinates %ROWTYPE;
BEGIN

SELECT id INTO smallest_city_id
FROM city
ORDER BY area ASC
LIMIT 1;

SELECT meters_above_sea_level INTO pos_z
FROM city
WHERE id = smallest_city_id;

IF pos_z IS NULL THEN
pos_z := 0;
END IF;

SELECT * INTO coords
FROM coordinates
WHERE id = (SELECT coordinates_id
FROM city
WHERE id = smallest_city_id);

RETURN SQRT(coords.x ^ 2 + coords.y ^ 2 + pos_z ^ 2);
END;

$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_dist_to_biggest_city(x0 DOUBLE PRECISION, y0 DOUBLE PRECISION, z0 DOUBLE PRECISION) RETURNS DOUBLE PRECISION AS $$
DECLARE
biggest_city_id BIGINT;
pos_z DOUBLE PRECISION;
coords coordinates %ROWTYPE;
BEGIN

SELECT id INTO biggest_city_id
FROM city
ORDER BY area DESC
LIMIT 1;

SELECT meters_above_sea_level INTO pos_z
FROM city
WHERE id = biggest_city_id;

IF pos_z IS NULL THEN
pos_z := 0;
END IF;

SELECT * INTO coords
FROM coordinates
WHERE id = (SELECT coordinates_id
FROM city
WHERE id = biggest_city_id);

RETURN SQRT((coords.x - x0) ^ 2 + (coords.y - y0) ^ 2 + (pos_z - z0) ^ 2);
END;

$$ LANGUAGE plpgsql;
