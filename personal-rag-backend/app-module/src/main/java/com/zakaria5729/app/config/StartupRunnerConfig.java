package com.zakaria5729.app.config;

import com.zakaria5729.library.rag.RagBuilder;
import org.jetbrains.annotations.NotNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.TimeZone;

@Component
public class StartupRunnerConfig implements CommandLineRunner {

    private final RagBuilder ragBuilder;

    public StartupRunnerConfig(RagBuilder ragBuilder) {
        this.ragBuilder = ragBuilder;
    }

    @Override
    public void run(@NotNull String... args) {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        ragBuilder.init();
    }
}