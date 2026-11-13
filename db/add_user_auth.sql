-- Для БД, в которой таблица users уже существует.
-- Старые записи без хеша пароля не могут использовать Basic Auth.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT CHECK (password_hash <> ''),
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN'));
