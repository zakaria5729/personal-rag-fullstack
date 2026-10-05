package com.zakaria5729.library.rag.model.response;

import jakarta.annotation.Nonnull;

public record RagResponse(
        @Nonnull
        String message,

        String hashId
) {}
