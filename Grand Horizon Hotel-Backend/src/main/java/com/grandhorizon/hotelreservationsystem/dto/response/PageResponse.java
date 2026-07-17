package com.grandhorizon.hotelreservationsystem.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Flat, stable pagination envelope. Deliberately not Spring Data's own
 * {@link Page} type directly - that serializes internal implementation
 * details (pageable, sort, etc.) that shouldn't be part of a public API
 * contract.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
