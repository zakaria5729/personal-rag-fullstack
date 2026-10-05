# Personal RAG Fullstack

Personal Retrieval-Augmented Generation app: knowledge ingestion (text / URL / PDF) plus streaming chat over your own data.

## Layout

- `personal-rag-backend/` – Spring Boot API (Java 21, Maven). See its README. Serves `http://localhost:8080`.
- `personal-rag-frontend/` – static chat UI. See its README. Served via `npm start` on `http://localhost:3000`, talks to the backend.

## Quickstart

1.  Start dependencies: PostgreSQL with `pgvector` (`static_rag` on `localhost:5432`) and Ollama (`localhost:11434`).
2.  Backend:
    ```bash
    cd personal-rag-backend
    mvn -pl rag-module,app-module -am compile
    mvn -pl app-module -am spring-boot:run
    ```
3.  Frontend (new terminal):
    ```bash
    cd personal-rag-frontend
    npm start
    ```
4.  Open `http://localhost:3000`.
