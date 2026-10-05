package com.zakaria5729.library.rag.service;

import com.zakaria5729.library.rag.exception.NotFoundException;
import com.zakaria5729.library.rag.model.ContentChunk;
import com.zakaria5729.library.rag.model.projection.VectorStoreContent;
import com.zakaria5729.library.rag.model.response.AskResponse;
import com.zakaria5729.library.rag.model.response.RagResponse;
import com.zakaria5729.library.rag.repository.VectorStoreRepository;
import com.zakaria5729.library.rag.store.VectorStore;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import static com.zakaria5729.library.rag.util.RagUtil.*;

@Service
class VectorStoreServiceImpl implements VectorStoreService {

    private final RagHelperService ragHelperService;
    private final StreamingChatLanguageModel streamingChatModel;
    private final VectorStoreRepository vectorStoreRepository;

    public VectorStoreServiceImpl(
            RagHelperService ragHelperService,
            StreamingChatLanguageModel streamingChatModel,
            VectorStoreRepository vectorStoreRepository
    ) {
        this.ragHelperService = ragHelperService;
        this.streamingChatModel = streamingChatModel;
        this.vectorStoreRepository = vectorStoreRepository;
    }

    @Override
    public void init() {
        vectorStoreRepository.createVectorStoreTableAndIndexesIfNotExists(DEFAULT_STORE_PREFIX);
    }

    @Override
    public void init(String storePrefix) {
        vectorStoreRepository.createVectorStoreTableAndIndexesIfNotExists(storePrefix);
    }

    @Override
    @Transactional
    public RagResponse insertTextToStore(String content) {
        return insertVectorStoreData(DEFAULT_STORE_PREFIX, content);
    }

    @Override
    @Transactional
    public RagResponse insertTextToStore(String storePrefix, String content) {
        return insertVectorStoreData(storePrefix, content);
    }

    @Override
    @Transactional
    public RagResponse insertFromUrlToStore(String url) {
        if (!isValidURL(url)) {
            return new RagResponse("Invalid url provided", null);
        }

        var content = fetchAndExtractContentFromUrl(url);
        if (content == null || content.isEmpty()) {
            return new RagResponse("Failed to fetch and extract content from this url", null);
        }

        return insertVectorStoreData(DEFAULT_STORE_PREFIX, content);
    }

    @Override
    @Transactional
    public RagResponse insertFromUrlToStore(String storePrefix, String url) {
        if (!isValidURL(url)) {
            return new RagResponse("Invalid url provided", null);
        }

        var content = fetchAndExtractContentFromUrl(url);
        if (content == null || content.isEmpty()) {
            return new RagResponse("Failed to fetch and extract content from this url", null);
        }
        return insertVectorStoreData(storePrefix, content);
    }

    @Override
    @Transactional
    public RagResponse insertFromPdfToStore(MultipartFile pdfFile) {
        return insertVectorStoreData(DEFAULT_STORE_PREFIX, extractTextFromMultipartPdf(pdfFile));
    }

    @Override
    @Transactional
    public RagResponse insertFromPdfToStore(String storePrefix, MultipartFile pdfFile) {
        return insertVectorStoreData(storePrefix, extractTextFromMultipartPdf(pdfFile));
    }

    @Override
    @Transactional
    public RagResponse updateToStore(String hashId, String content) {
        return updateVectorStoreData(DEFAULT_STORE_PREFIX, hashId, content);
    }

    @Override
    @Transactional
    public RagResponse updateToStore(String storePrefix, String hashId, String content) {
        return updateVectorStoreData(storePrefix, hashId, content);
    }

    @Override
    @Transactional
    public boolean deleteAllByHashIdFromStore(String hashId) {
        return deleteAllItemsByHashId(DEFAULT_STORE_PREFIX, hashId);
    }

    @Override
    @Transactional
    public boolean deleteAllByHashIdFromStore(String storePrefix, String hashId) {
        return deleteAllItemsByHashId(storePrefix, hashId);
    }

    @Override
    public List<VectorStoreContent> findAllByHashIdFromStore(String hashId) {
        return getAllByHashId(DEFAULT_STORE_PREFIX, hashId);
    }

    @Override
    public List<VectorStoreContent> findAllByHashIdFromStore(String storePrefix, String hashId) {
        return getAllByHashId(storePrefix, hashId);
    }

    @Override
    public SseEmitter ask(String query) {
        return askQuery(DEFAULT_STORE_PREFIX, query);
    }

    @Override
    public SseEmitter ask(String storePrefix, String query) {
        return askQuery(storePrefix, query);
    }

    private SseEmitter askQuery(String storePrefix, String query) {
        var executor = Executors.newVirtualThreadPerTaskExecutor();
        var isCancelled = new AtomicBoolean(false);
        var emitter = ragHelperService.getSseEmitter(executor, isCancelled);

        executor.submit(() -> {
            try {
                ragHelperService.checkSseStatus(isCancelled);

                var queriesFuture = executor.submit(() -> ragHelperService.planQueries(query));
                ragHelperService.sendSseEvent(emitter, isCancelled, new AskResponse("status", "analyzing-query"));

                var subEmbedFutures = queriesFuture.get().stream().map(sq -> executor.submit(() -> ragHelperService.getEmbeddingVectorString(sq))).toList();

                ragHelperService.sendSseEvent(emitter, isCancelled, new AskResponse("status", "retrieving-info"));

                var retrieveFutures = subEmbedFutures.stream().map(vec -> executor.submit(() -> ragHelperService.retrieveDbQueryResults(vectorStoreRepository, storePrefix, vec.get()))).toList();

                ragHelperService.checkSseStatus(isCancelled);

                var rawResults = retrieveFutures.stream().map(f -> {
                    try {
                        return f.get();
                    } catch (Exception e) {
                        return List.<String>of();
                    }
                }).flatMap(List::stream).filter(r -> r != null && !r.isBlank()).distinct().toList();

                ragHelperService.sendSseEvent(emitter, isCancelled, new AskResponse("status", "reranking-info"));
                var scoredContents = ragHelperService.getScoredContents(rawResults, query, executor);
                var rerankedContents = ragHelperService.getRerankedContents(scoredContents);

                var chatMessages = ragHelperService.getPromptChatMessages(rerankedContents, query);
                ragHelperService.sendSseEvent(emitter, isCancelled, new AskResponse("status", "generating-response"));

                if (chatMessages.isEmpty()) {
                    ragHelperService.sendSseEvent(emitter, isCancelled, new AskResponse("message", "I don't have enough information to answer this question."));
                    ragHelperService.sendSseCompleteEvent(emitter, isCancelled, executor);
                    return;
                }

                streamingChatModel.generate(chatMessages, ragHelperService.createSseStreamingHandler(emitter, isCancelled, executor));

            } catch (Exception e) {
                ragLogger.error("RAG pipeline failed: {}", query, e);
                ragHelperService.sendSseEvent(emitter, isCancelled, new AskResponse("status", "error"));
                ragHelperService.sendSseCompleteEvent(emitter, isCancelled, executor);
            }
        });

        return emitter;
    }

    private RagResponse insertVectorStoreData(String storePrefix, String content) {
        var hashId = saveKnowledgeVectors(storePrefix, ragHelperService.getContentChunks(content));
        return new RagResponse(hashId != null ? "Insert Successfully" : "Something went wrong. Please try again", hashId);
    }

    private RagResponse updateVectorStoreData(String storePrefix, String hashId, String content) {
        if (vectorStoreRepository.deleteAllByHashId(storePrefix, hashId) <= 0) {
            throw new NotFoundException();
        }

        hashId = saveKnowledgeVectors(storePrefix, ragHelperService.getContentChunks(content));
        return new RagResponse(hashId != null ? "Update Successfully" : "Something went wrong. Please try again", hashId);
    }

    private boolean deleteAllItemsByHashId(String storePrefix, String hashId) {
        return vectorStoreRepository.deleteAllByHashId(storePrefix, hashId) > 0;
    }

    private List<VectorStoreContent> getAllByHashId(String storePrefix, String hashId) {
        return vectorStoreRepository.findAllByHashId(storePrefix, hashId);
    }

    private String saveKnowledgeVectors(String storePrefix, List<ContentChunk> contentChunks) {
        if (contentChunks.isEmpty()) {
            ragLogger.warn("No valid content/chunk found. size: {}", 0);
            return null;
        }

        // Embed all chunks in parallel using virtual threads
        try (ExecutorService vThreadPool = Executors.newVirtualThreadPerTaskExecutor()) {
            var embedFutures = contentChunks.stream().map(chunk -> vThreadPool.submit(() -> ragHelperService.getEmbeddingVector(chunk.chunk()))).toList();

            var vectorStores = new ArrayList<VectorStore>();
            for (var i = 0; i < contentChunks.size(); i++) {
                var embeddingVector = embedFutures.get(i).get();
                if (embeddingVector.isEmpty() || embeddingVector.get().length == 0) {
                    ragLogger.warn("Embedding failed for chunk #{}, skipping: [{}...]", i, contentChunks.get(i).chunk().substring(0, Math.min(60, contentChunks.get(i).chunk().length())));
                    continue;
                }
                var vector = new VectorStore();
                vector.setContentChunk(contentChunks.get(i).chunk());
                vector.setEmbedding(embeddingVector.get());
                vectorStores.add(vector);
            }

            if (!vectorStores.isEmpty()) {
                return vectorStoreRepository.saveAllVectorStores(storePrefix, vectorStores);
            }
            ragLogger.warn("All chunk embeddings failed — nothing saved to vector store.");
            return null;
        } catch (Exception e) {
            ragLogger.error("Failed to embed and save chunks", e);
            return null;
        }
    }
}
