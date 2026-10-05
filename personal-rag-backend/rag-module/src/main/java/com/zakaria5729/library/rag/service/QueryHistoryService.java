package com.zakaria5729.library.rag.service;

import com.zakaria5729.library.rag.model.projection.VectorStoreContent;
import com.zakaria5729.library.rag.model.response.RagResponse;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

public interface QueryHistoryService {
    void init();

    void init(String storePrefix);

    RagResponse insertToQueryHistory(String query);

    RagResponse insertToQueryHistory(String storePrefix, String query);
}
