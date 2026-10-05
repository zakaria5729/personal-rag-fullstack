package com.zakaria5729.library.rag.repository;

import com.zakaria5729.library.rag.model.projection.VectorStoreContent;
import com.zakaria5729.library.rag.store.VectorStore;

import java.util.List;

public interface VectorStoreRepository {

    String saveAllVectorStores(String storePrefix, List<VectorStore> vectorStores);

    int deleteAllByHashId(String storePrefix, String hashId);

    List<VectorStoreContent> findAllByHashId(String storePrefix, String hashId);

    List<String> getContentChunksFromVectorStore(String storePrefix, String vectorString, double similarityThreshold, int queryResultLimit);

    void createVectorStoreTableAndIndexesIfNotExists(String storePrefix);
}
