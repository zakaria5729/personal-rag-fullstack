package com.zakaria5729.library.rag.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.data.jdbc.repository.config.EnableJdbcAuditing;
import org.springframework.data.jdbc.repository.config.EnableJdbcRepositories;

@AutoConfiguration
@ConditionalOnProperty(prefix = "rag-module", name = "enabled", havingValue = "true", matchIfMissing = true)
@ComponentScan(basePackages = "com.zakaria5729.library.rag")
@EnableJdbcRepositories(basePackages = "com.zakaria5729.library.rag.repository")
@EnableJdbcAuditing
@Import({
        LangChainConfig.class,
        RerankerConfig.class,
        SentenceSplitConfig.class,
        JdbcConverterConfiguration.class
})
public class RagAutoConfiguration { }
