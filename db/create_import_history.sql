CREATE TYPE import_status_enum AS ENUM ('SUCCESS', 'FAILED', 'RUNNING');

CREATE TABLE
    IF NOT EXISTS import_city_history (
        id SERIAL PRIMARY KEY,
        file_name TEXT NOT NULL CHECK (file_name <> ''),
        user_id INTEGER NOT NULL REFERENCES users,
        import_status import_status_enum NOT NULL,
        import_date TIMESTAMP NOT NULL DEFAULT NOW (),
        imported_rows_count INTEGER CHECK (imported_rows_count > 0),
        CHECK (import_status <> 'SUCCESS' OR imported_rows_count IS NOT NULL)
    );