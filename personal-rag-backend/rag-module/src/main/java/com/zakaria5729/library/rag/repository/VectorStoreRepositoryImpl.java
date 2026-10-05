package com.zakaria5729.library.rag.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.f4b6a3.uuid.UuidCreator;
import com.zakaria5729.library.rag.model.projection.VectorStoreContent;
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
class VectorStoreRepositoryImpl implements VectorStoreRepository {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final ObjectMapper objectMapper;

    public VectorStoreRepositoryImpl(JdbcTemplate jdbcTemplate, DataSource dataSource, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
        this.objectMapper = objectMapper;
    }

    @Override
    public String saveAllVectorStores(String storePrefix, List<VectorStore> vectorStores) {
        var uuidV7 = UuidCreator.getTimeOrderedEpoch().toString();

        var sql = """
                INSERT INTO %s (content_chunk, metadata, embedding, hash_id, created_at, updated_at)
                VALUES (?, ?::jsonb, ?::vector, ?, ?, ?)
                """.formatted(getVectorStoreTable(storePrefix));

        var now = OffsetDateTime.now();
        var timestamp = Timestamp.from(now.toInstant());

        jdbcTemplate.batchUpdate(sql, vectorStores, vectorStores.size(), (ps, vectorStore) -> {
            ps.setString(1, vectorStore.getContentChunk());
            ps.setString(2, convertMapToJson(vectorStore.getMetadata()));
            ps.setString(3, floatArrayToVectorString(vectorStore.getEmbedding()));
            ps.setString(4, uuidV7);
            ps.setTimestamp(5, timestamp);
            ps.setTimestamp(6, timestamp);
        });

        return uuidV7;
    }

    private String convertMapToJson(Map<String, Object> map) {
        try {
            if (map == null || map.isEmpty()) {
                return "{}";
            }
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            throw new IllegalArgumentException("Error converting Map to JSON", e);
        }
    }

    @Override
    public int deleteAllByHashId(String storePrefix, String hashId) {
        return jdbcTemplate.update("DELETE FROM %s WHERE hash_id = ?".formatted(getVectorStoreTable(storePrefix)), hashId);
    }

    @Override
    public List<VectorStoreContent> findAllByHashId(String storePrefix, String hashId) {
        var sql = "SELECT id, content_chunk, metadata, created_at, updated_at FROM %s WHERE hash_id = ?".formatted(getVectorStoreTable(storePrefix));

        return jdbcTemplate.query(sql, (ResultSet rs, int rowNum) -> {
                    try {
                        var metadataJson = rs.getString("metadata");
                        var metadata = metadataJson != null
                                ? objectMapper.readValue(metadataJson, Map.class)
                                : null;

                        return new VectorStoreContent(
                                rs.getInt("id"),
                                rs.getString("content_chunk"),
                                metadata,
                                rs.getObject("created_at", OffsetDateTime.class),
                                rs.getObject("updated_at", OffsetDateTime.class)
                        );
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException("Failed to parse metadata JSON", e);
                    }
                },
                hashId
        );
    }

    @Override
    public List<String> getContentChunksFromVectorStore(String storePrefix, String vectorString, double similarityThreshold, int queryResultLimit) {
        var sql = """
                SELECT content_chunk
                FROM %s
                WHERE (embedding <=> ?::vector) < ?
                ORDER BY embedding <=> ?::vector ASC
                LIMIT ?;
                """.formatted(getVectorStoreTable(storePrefix)
        );

        return jdbcTemplate.queryForList(
                sql,
                String.class,
                vectorString,
                similarityThreshold,
                vectorString,
                queryResultLimit
        );
    }

    @Override
    public void createVectorStoreTableAndIndexesIfNotExists(String storePrefix) {
        var sqlTemplate = """
                CREATE EXTENSION IF NOT EXISTS vector;
                
                CREATE SEQUENCE IF NOT EXISTS ${STORE_PREFIX}_id_seq START WITH 1 INCREMENT BY 50;
                
                CREATE TABLE IF NOT EXISTS ${STORE_PREFIX} (
                    id INTEGER PRIMARY KEY DEFAULT nextval('${STORE_PREFIX}_id_seq'),
                    content_chunk TEXT NOT NULL,
                    metadata JSONB,
                    embedding VECTOR(768),
                    hash_id VARCHAR(64),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_${STORE_PREFIX}_hash_id ON ${STORE_PREFIX} (hash_id);
                
                CREATE INDEX IF NOT EXISTS idx_${STORE_PREFIX}_hnsw ON ${STORE_PREFIX} USING hnsw (embedding vector_cosine_ops);
                """;

        var sql = sqlTemplate.replace("${STORE_PREFIX}", getVectorStoreTable(storePrefix));

        try (var conn = dataSource.getConnection(); var stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
