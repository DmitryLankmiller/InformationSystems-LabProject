package ru.ifmo.se.dto;

import java.util.List;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema 
public class PageResponse<T> {
    int page;
    int size;
    boolean hasNext;
    long totalPages;
    long totalElements;
    List<T> content;
}
