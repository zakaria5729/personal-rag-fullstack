package com.zakaria5729.library.rag.config;

import opennlp.tools.sentdetect.SentenceDetector;
import opennlp.tools.sentdetect.SentenceDetectorME;
import opennlp.tools.sentdetect.SentenceModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import static com.zakaria5729.library.rag.util.RagUtil.ragLogger;

@Configuration
public class SentenceSplitConfig {

    @Value("${sentence-split.model-path:./models/opennlp-en-sent.bin}")
    private String sentenceSplitModelPath;

    @Bean
    public SentenceDetector sentenceDetector() throws IOException {
        if (Files.notExists(Paths.get(sentenceSplitModelPath))) {
            throw new FileNotFoundException("External sentence split NLP model (*.bin) file not found at specified paths");
        }

        var model = new SentenceModel(Paths.get(sentenceSplitModelPath));
        var decoder = new SentenceDetectorME(model);
        ragLogger.info("Loaded sentence decoder/split model from external path: {}", sentenceSplitModelPath);
        return decoder;
    }
}
