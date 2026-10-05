package com.zakaria5729.library.rag.model;

import java.util.ArrayList;
import java.util.Map;

public record ContentMetadata(
        String title,
        String description,
        ArrayList<String> keywords,
        String category,
        Integer length,
        Map<String, Object> customMetadata
) { }
