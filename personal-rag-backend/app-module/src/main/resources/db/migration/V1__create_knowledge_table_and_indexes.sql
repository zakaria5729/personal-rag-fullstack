CREATE EXTENSION IF NOT EXISTS vector;

CREATE SEQUENCE IF NOT EXISTS knowledge_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY DEFAULT nextval('knowledge_id_seq'),
    hash_id VARCHAR(64) NOT NULL,
    content_preview VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(2048),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_content_hash ON knowledge (digest(content, 'sha256'));
