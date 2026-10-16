package ru.ifmo.se.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PageResponse<T> {
    int page;
    int size;
    boolean hasNext;
    long totalPages;
    long totalElements;
    List<T> content;
}
