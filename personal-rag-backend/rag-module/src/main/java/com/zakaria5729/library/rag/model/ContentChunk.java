package com.zakaria5729.library.rag.model;

public record ContentChunk(
        String chunk,
        ContentMetadata metadata
) {
    public void addMetadata(String key, String value) {
        metadata.customMetadata().putIfAbsent(key, value);
    }
}
