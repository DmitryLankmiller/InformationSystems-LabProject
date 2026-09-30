# InformationSystems-LabProject

TO DO: краткое описание проекта

## Backend

В качестве сервера приложений используется `Payara Micro`

### Зависимости

- Payara Micro 7.2026.9 (JAR). [Ссылка](https://www.azul.com/downloads/azul-payara-community-edition/)
- Apache Maven 3.6.3
- Java version: 21

### Сборка и деплой

Все описанные ниже команды исполняются из директории backend.

```sh
cd backend
```

#### Сборка

Сборка `war`-архива приложения

```sh
mvn clean package
```

`war`-архив будет создан в `./target/city-manager.war`

#### Деплой

Для деплоя приложения необходимо настроить подключение к БД PostgreSQL. Для этого нужно скопировать содержимое файла `.env.example` в файл `.env` и выставить указанные переменные согласно примеру.

```sh
cp .env.example .env
```

Далее, необходимо экспортировать данные переменные окружения в текущем терминале и производить деплоем в том же терминале.

```sh
set -a
source .env
set +a
```

Для запуска сервера приложений и деплоя `war`-ника используется скачанный ранее `payara-micro.jar`

```sh
java -jar payara-micro.jar --postbootcommandfile ./payara-boot/prepare-jdbc-connection.txt --deploy ./target/city-manager.war --contextroot ""
```

После завершения развёртывания приложение будет доступно на порту `8080`.

## Полезные команды

Проброс порта `5432` с `helios` на `localhost`

```sh
ssh -L localhost:5432:pg:5432 helios
```

Подключение к БД через `psql`

```sh
psql -h localhost -d studs -U s373305
```

Деплой `war`-архива через `payara-micro`

```sh
mvn clean package && java -jar payara-micro.jar --postbootcommandfile ./payara-boot/prepare-jdbc-connection.txt --deploy ./target/city-manager.war --contextroot ""
```
