package com.zakaria5729.app.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;

public record ApiResponse(
        @JsonProperty("message")
        @Nonnull
        String message,

        @JsonProperty("data")
        @Nullable
        Object data
) {}
