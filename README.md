# InformationSystems-LabProject

TO DO: краткое описание проекта

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
java -jar payara-micro.jar --deploy ./target/city-manager.war --contextroot ""
```
