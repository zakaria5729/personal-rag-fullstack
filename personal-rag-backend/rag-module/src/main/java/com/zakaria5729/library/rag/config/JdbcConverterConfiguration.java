package com.zakaria5729.library.rag.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jetbrains.annotations.NotNull;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.jdbc.core.convert.JdbcCustomConversions;
import org.springframework.data.jdbc.repository.config.AbstractJdbcConfiguration;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;

@Configuration
public class JdbcConverterConfiguration extends AbstractJdbcConfiguration {

    @NotNull
    @Bean
    @Override
    public JdbcCustomConversions jdbcCustomConversions() {
        return new JdbcCustomConversions(Arrays.asList(
                new MapToJsonConverter(),
                new JsonToMapConverter(),
                new FloatArrayToStringConverter(),
                new StringToFloatArrayConverter()
        ));
    }

    @WritingConverter
    static class MapToJsonConverter implements Converter<Map<String, Object>, String> {
        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public String convert(@NotNull Map<String, Object> source) {
            try {
                return objectMapper.writeValueAsString(source);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Error converting Map to JSON", e);
            }
        }
    }

    @ReadingConverter
    static class JsonToMapConverter implements Converter<String, Map<String, Object>> {
        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        @SuppressWarnings("unchecked")
        public Map<String, Object> convert(@NotNull String source) {
            try {
                if (source.isEmpty()) {
                    return Map.of();
                }
                return objectMapper.readValue(source, Map.class);
            } catch (IOException e) {
                throw new IllegalArgumentException("Error converting JSON to Map", e);
            }
        }
    }

    @WritingConverter
    static class FloatArrayToStringConverter implements Converter<float[], String> {
        @Override
        public String convert(@NotNull float[] source) {
            if (source.length == 0) {
                return "[]";
            }
            var sb = new StringBuilder("[");
            for (int i = 0; i < source.length; i++) {
                if (i > 0) sb.append(",");
                sb.append(source[i]);
            }
            sb.append("]");
            return sb.toString();
        }
    }

    @ReadingConverter
    static class StringToFloatArrayConverter implements Converter<String, float[]> {
        @Override
        public float[] convert(@NotNull String source) {
            if (source.isEmpty() || source.equals("[]")) {
                return new float[0];
            }
            
            // Remove brackets and split by comma
            var cleaned = source.substring(1, source.length() - 1);
            if (cleaned.isEmpty()) {
                return new float[0];
            }
            
            var parts = cleaned.split(",");
            var result = new float[parts.length];
            
            for (int i = 0; i < parts.length; i++) {
                result[i] = Float.parseFloat(parts[i].trim());
            }
            return result;
        }
    }
}
