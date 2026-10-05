package com.zakaria5729.library.rag.config;

import com.zakaria5729.library.rag.util.KeywordScoringModel;
import dev.langchain4j.model.scoring.ScoringModel;
import dev.langchain4j.model.scoring.onnx.OnnxScoringModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static com.zakaria5729.library.rag.util.RagUtil.ragLogger;

@Configuration
public class RerankerConfig {

    @Value("${reranker.models-base-path:./models/reranker}")
    private String modelsBasePath;

    @Bean
    public ScoringModel scoringModel() throws IOException {
        try {
            var rerankerModelPath = resolve("model.onnx");
            var tokenizerModelPath = resolve("tokenizer.json");

            if (Files.notExists(rerankerModelPath)) {
                throw new FileNotFoundException("External reranker model.onnx file not found at specified paths");
            }

            if (Files.notExists(tokenizerModelPath)) {
                throw new FileNotFoundException("External reranker tokenizer.json file not found at specified paths");
            }

            var model = new OnnxScoringModel(rerankerModelPath.toString(), tokenizerModelPath.toString(), 508);
            ragLogger.info("Loaded ONNX Reranker from external path: {}", rerankerModelPath);
            return model;

        } catch (Exception e) {
            ragLogger.error("Failed to load external ONNX model: {}. Falling back to Keyword search.", e.getMessage());
            return new KeywordScoringModel();
        }
    }

    public Path resolve(String relativePath) throws IOException {
        var basePath = getBasePath();
        var modelPath = basePath.resolve(relativePath.replaceFirst("^/+", "")).normalize();

        if (!modelPath.startsWith(basePath)) {
            throw new SecurityException("Path traversal attempt: " + relativePath);
        }

        if (!Files.exists(modelPath)) {
            throw new FileNotFoundException("Model not found at: " + modelPath);
        }
        return modelPath;
    }

    private Path getBasePath() throws IOException {
        var cleanBase = modelsBasePath.replaceAll("/+$", "");
        cleanBase += "/";
        return Paths.get(cleanBase).toRealPath();
    }
}
