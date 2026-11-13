CREATE TABLE
    IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_name TEXT NOT NULL UNIQUE CHECK (user_name <> ''),
        password_hash TEXT CHECK (password_hash <> ''),
        role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
        created_date TIMESTAMP NOT NULL DEFAULT NOW ()
    );
