package com.zakaria5729.app.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record PaginatedResponse<T>(
        @JsonProperty("items")
        List<T> items,

        @JsonProperty("next_cursor_id")
        Integer nextCursorId,

        @JsonProperty("has_next")
        boolean hasNext
) {}
