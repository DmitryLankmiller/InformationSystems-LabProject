CREATE TABLE
    IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_name TEXT NOT NULL UNIQUE CHECK (user_name <> ''),
        created_date TIMESTAMP NOT NULL DEFAULT NOW ()
    );