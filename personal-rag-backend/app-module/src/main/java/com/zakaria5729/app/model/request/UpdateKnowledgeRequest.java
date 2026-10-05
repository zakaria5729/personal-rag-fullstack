package com.zakaria5729.app.model.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record UpdateKnowledgeRequest(
        @JsonProperty("content")
        @NotBlank
        String content
) {}
