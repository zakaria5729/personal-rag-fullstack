package com.zakaria5729.library.rag;

import com.zakaria5729.library.rag.model.projection.VectorStoreContent;
import com.zakaria5729.library.rag.model.response.RagResponse;
import com.zakaria5729.library.rag.service.QueryHistoryService;
import com.zakaria5729.library.rag.service.VectorStoreService;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@Component
public class RagBuilder {

    private final VectorStoreService vectorStoreService;
    private final QueryHistoryService queryHistoryService;

    public RagBuilder(
            VectorStoreService vectorStoreService,
            QueryHistoryService queryHistoryService
    ) {
        this.vectorStoreService = vectorStoreService;
        this.queryHistoryService = queryHistoryService;
    }

    public void init() {
        vectorStoreService.init();
        queryHistoryService.init();
    }

    public void init(String storePrefix) {
        vectorStoreService.init(storePrefix);
        queryHistoryService.init();
    }

    public RagResponse insertTextToStore(String content) {
        return vectorStoreService.insertTextToStore(content);
    }

    public RagResponse insertTextToStore(String storePrefix, String content) {
        return vectorStoreService.insertTextToStore(storePrefix, content);
    }

    public RagResponse insertFromUrlToStore(String url) {
        return vectorStoreService.insertFromUrlToStore(url);
    }

    public RagResponse insertFromUrlToStore(String storePrefix, String url) {
        return vectorStoreService.insertFromUrlToStore(storePrefix, url);
    }

    public RagResponse insertFromPdfToStore(String storePrefix, MultipartFile pdfFile) {
        return vectorStoreService.insertFromPdfToStore(storePrefix, pdfFile);
    }

    public RagResponse insertFromPdfToStore(MultipartFile pdfFile) {
        return vectorStoreService.insertFromPdfToStore(pdfFile);
    }

    public RagResponse updateToStore(String hashId, String content) {
        return vectorStoreService.updateToStore(hashId, content);
    }

    public RagResponse updateToStore(String storePrefix, String hashId, String content) {
        return vectorStoreService.updateToStore(storePrefix, hashId, content);
    }

    public boolean deleteAllByHashIdFromStore(String hashId) {
        return vectorStoreService.deleteAllByHashIdFromStore(hashId);
    }

    public boolean deleteAllByHashIdFromStore(String storePrefix, String hashId) {
        return vectorStoreService.deleteAllByHashIdFromStore(storePrefix, hashId);
    }

    public List<VectorStoreContent> findAllByHashIdFromStore(String hashId) {
        return vectorStoreService.findAllByHashIdFromStore(hashId);
    }

    public List<VectorStoreContent> findAllByHashIdFromStore(String storePrefix, String hashId) {
        return vectorStoreService.findAllByHashIdFromStore(storePrefix, hashId);
    }

    public SseEmitter ask(String query) {
        return vectorStoreService.ask(query);
    }

    public SseEmitter ask(String storePrefix, String query) {
        return vectorStoreService.ask(storePrefix, query);
    }

    public RagResponse insertToQueryHistory(String query) {
        return queryHistoryService.insertToQueryHistory(query);
    }

    public RagResponse insertToQueryHistory(String storePrefix, String query) {
        return queryHistoryService.insertToQueryHistory(storePrefix, query);
    }
}