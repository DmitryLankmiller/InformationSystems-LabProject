package ru.ifmo.se.exception;

public class ImportSubmissionException extends RuntimeException {
    public ImportSubmissionException(Exception cause) {
        super(cause);
    }
}
