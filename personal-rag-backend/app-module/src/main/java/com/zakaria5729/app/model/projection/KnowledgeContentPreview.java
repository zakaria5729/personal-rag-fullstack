package com.zakaria5729.app.model.projection;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.OffsetDateTime;

public interface KnowledgeContentPreview {
    @JsonProperty("id")
    Integer getId();

    @JsonProperty("source")
    String getSource();

    @JsonProperty("content_preview")
    String getContentPreview();

    @JsonProperty("created_at")
    OffsetDateTime getCreatedAt();

    @JsonProperty("updated_at")
    OffsetDateTime getUpdatedAt();
}
