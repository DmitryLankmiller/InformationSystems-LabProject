package ru.ifmo.se.repository.search;

import java.util.List;

public record SearchPage<T>(
    List<T> content,
    long totalElements,
    int page,
    int size,
    boolean hasNext,
    long totalPages) {
}