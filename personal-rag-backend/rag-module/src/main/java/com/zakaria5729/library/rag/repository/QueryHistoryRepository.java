package com.zakaria5729.library.rag.repository;

public interface QueryHistoryRepository {

    void createQueryHistoryTableAndIndexesIfNotExists(String storePrefix);
}
