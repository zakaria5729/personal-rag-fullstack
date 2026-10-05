package com.zakaria5729.app.model.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.zakaria5729.app.ContentSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateKnowledgeRequest(
        @JsonProperty("content")
        @NotBlank
        String content,

        @JsonProperty("type")
        @NotNull
        ContentSource type
) {}
