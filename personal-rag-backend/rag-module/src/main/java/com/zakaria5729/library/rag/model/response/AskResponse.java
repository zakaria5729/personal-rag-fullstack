package com.zakaria5729.library.rag.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AskResponse(
        @JsonProperty("type") String type,
        @JsonProperty("content") String content
) {}
