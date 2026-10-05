package com.zakaria5729.library.rag.model.projection;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.OffsetDateTime;
import java.util.Map;

public record VectorStoreContent(
    @JsonProperty("id")
    Integer id,
    
    @JsonProperty("content_chunk")
    String contentChunk,
    
    @JsonProperty("metadata")
    Map<String, Object> metadata,
    
    @JsonProperty("created_at")
    OffsetDateTime createdAt,
    
    @JsonProperty("updated_at")
    OffsetDateTime updatedAt
) {
}
