package com.zakaria5729.library.rag.util;

import com.zakaria5729.library.rag.model.ContentMetadata;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.spring.AiService;

@AiService
public interface LlmMetadataExtractor {

    @UserMessage("Extract metadata from this text: {{it}}")
    ContentMetadata extract(String text);
}
