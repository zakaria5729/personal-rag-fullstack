package com.zakaria5729.library.rag.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.f4b6a3.uuid.UuidCreator;
import com.zakaria5729.library.rag.model.projection.VectorStoreContent;
import com.zakaria5729.library.rag.service.QueryHistoryService;
import com.zakaria5729.library.rag.store.VectorStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import static com.zakaria5729.library.rag.util.RagUtil.floatArrayToVectorString;
import static com.zakaria5729.library.rag.util.RagUtil.getVectorStoreTable;

@Repository
class QueryHistoryRepositoryImpl implements QueryHistoryRepository {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final ObjectMapper objectMapper;

    public QueryHistoryRepositoryImpl(JdbcTemplate jdbcTemplate, DataSource dataSource, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
        this.objectMapper = objectMapper;
    }

    @Override
    public void createQueryHistoryTableAndIndexesIfNotExists(String storePrefix) {
        var sqlTemplate = """
                CREATE SEQUENCE IF NOT EXISTS ${STORE_PREFIX}_query_history_id_seq START WITH 1 INCREMENT BY 50;
                
                CREATE TABLE IF NOT EXISTS ${STORE_PREFIX}_query_history (
                    id INTEGER PRIMARY KEY DEFAULT nextval('${STORE_PREFIX}_query_history_id_seq'),
                    query VARCHAR(64) NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                """;

        var sql = sqlTemplate.replace("${STORE_PREFIX}", getVectorStoreTable(storePrefix));

        try (var conn = dataSource.getConnection(); var stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
