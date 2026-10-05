package com.zakaria5729.library.rag.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.ollama.OllamaEmbeddingModel;
import dev.langchain4j.model.ollama.OllamaStreamingChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LangChainConfig {

    @Value("${lang-chain4j.chat-model.base-url:http://localhost:11434}")
    private String chatModelBaseUrl;

    @Value("${lang-chain4j.chat-model.name:llama3.2}")
    private String chatModelName;

    @Value("${lang-chain4j.chat-model.predictivity-level:0.8}")
    private Double chatPredictivityLevel;

    @Value("${lang-chain4j.streaming-chat-model.base-url:http://localhost:11434}")
    private String streamingChatModelBaseUrl;

    @Value("${lang-chain4j.streaming-chat-model.name:llama3.2}")
    private String streamingChatModelName;

    @Value("${lang-chain4j.streaming-chat-model.predictivity-level:0.8}")
    private Double streamingChatPredictivityLevel;

    @Value("${lang-chain4j.embedding-model.base-url:http://localhost:11434}")
    private String embeddingModelBaseUrl;

    @Value("${lang-chain4j.embedding-model.name:nomic-embed-text}")
    private String embeddingModelName;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return OllamaChatModel.builder()
                .baseUrl(chatModelBaseUrl)
                .modelName(chatModelName)
                .temperature(chatPredictivityLevel)
                .build();
    }

    @Bean
    public StreamingChatLanguageModel streamingChatLanguageModel() {
        return OllamaStreamingChatModel.builder()
                .baseUrl(streamingChatModelBaseUrl)
                .modelName(streamingChatModelName)
                .temperature(streamingChatPredictivityLevel)
                .build();
    }

    @Bean
    public EmbeddingModel embeddingModel() {
        return OllamaEmbeddingModel.builder()
                .baseUrl(embeddingModelBaseUrl)
                .modelName(embeddingModelName)
                .build();
    }
}
