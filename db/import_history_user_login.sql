-- Однократная миграция для истории, которая ещё хранит user_id.
-- Для новой БД достаточно create_import_history.sql.
BEGIN;

ALTER TABLE import_city_history ADD COLUMN user_login TEXT;

UPDATE import_city_history AS history
SET user_login = account.user_name
FROM users AS account
WHERE history.user_id = account.id;

ALTER TABLE import_city_history
    ALTER COLUMN user_login SET NOT NULL,
    ADD CONSTRAINT import_city_history_user_login_fkey
        FOREIGN KEY (user_login) REFERENCES users (user_name),
    DROP COLUMN user_id;

COMMIT;
