package ru.ifmo.se.exception;

public class ImportDataException extends RuntimeException {
    public ImportDataException(String message) {
        super(message);
    }

    public ImportDataException(String message, Throwable cause) {
        super(message, cause);
    }
}
