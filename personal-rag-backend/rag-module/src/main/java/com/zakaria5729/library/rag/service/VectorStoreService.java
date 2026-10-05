package com.zakaria5729.library.rag.service;

import com.zakaria5729.library.rag.model.projection.VectorStoreContent;
import com.zakaria5729.library.rag.model.response.RagResponse;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

public interface VectorStoreService {
    void init();

    void init(String storePrefix);

    RagResponse insertTextToStore(String content);

    RagResponse insertTextToStore(String storePrefix, String content);

    RagResponse insertFromUrlToStore(String url);

    RagResponse insertFromUrlToStore(String storePrefix, String url);

    RagResponse insertFromPdfToStore(MultipartFile pdfFile);

    RagResponse insertFromPdfToStore(String storePrefix, MultipartFile pdfFile);

    RagResponse updateToStore(String hashId, String content);

    RagResponse updateToStore(String storePrefix, String hashId, String content);

    boolean deleteAllByHashIdFromStore(String hashId);

    boolean deleteAllByHashIdFromStore(String storePrefix, String hashId);

    List<VectorStoreContent> findAllByHashIdFromStore(String hashId);

    List<VectorStoreContent> findAllByHashIdFromStore(String storePrefix, String hashId);

    SseEmitter ask(String query);

    SseEmitter ask(String storePrefix, String query);
}
