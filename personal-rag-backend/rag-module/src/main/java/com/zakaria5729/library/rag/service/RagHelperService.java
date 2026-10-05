package com.zakaria5729.library.rag.service;

import com.zakaria5729.library.rag.model.ContentChunk;
import com.zakaria5729.library.rag.model.ContentMetadata;
import com.zakaria5729.library.rag.model.ScoredContent;
import com.zakaria5729.library.rag.model.response.AskResponse;
import com.zakaria5729.library.rag.repository.VectorStoreRepository;
import com.zakaria5729.library.rag.util.LlmMetadataExtractor;
import com.zakaria5729.library.rag.util.LlmQueryPlanner;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.scoring.ScoringModel;
import opennlp.tools.sentdetect.SentenceDetector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;
import java.util.stream.IntStream;

import static com.zakaria5729.library.rag.util.RagUtil.*;
import static java.util.concurrent.TimeUnit.MINUTES;

@Service
class RagHelperService {

    @Value("${vector-store.max-chunk-size:500}")
    private int maxChunkSize;

    @Value("${vector-store.normalize-vector:true}")
    private boolean normalizeVector;

    @Value("${vector-store.extract-metadata:false}")
    private boolean extractMetadata;

    @Value("${vector-store.apply-reranking:true}")
    private boolean applyReranking;

    @Value("${vector-store.query-result-limit:20}")
    private int queryResultLimit;

    @Value("${vector-store.rerank-result-limit:10}")
    private int rerankResultLimit;

    @Value("${vector-store.similarity-threshold:0.50}")
    private double similarityThreshold;

    @Value("${vector-store.rerank-score-threshold:0.0}")
    private double rerankScoreThreshold;

    @Value("${rag-module.sse-timeout-minute:5}")
    private int sseTimeoutMinute;

    @Value("${rag-module.invalid-query-msg:No info found}")
    private String invalidQueryMessage;

    @Value("${rag-module.split-user-query:false}")
    private boolean splitUserQuery;

    @Value("${vector-store.case-insensitive:false}")
    private boolean caseInsensitive;

    private final LlmMetadataExtractor llmMetadataExtractor;
    private final SentenceDetector sentenceDetector;
    private final EmbeddingModel embeddingModel;
    private final ScoringModel scoringModel;
    private final JdbcTemplate jdbcTemplate;
    private final LlmQueryPlanner llmQueryPlanner;

    private final Pattern LINE_BREAKS = Pattern.compile("\\R");
    private final Pattern MULTI_SPACES = Pattern.compile("\\s{2,}");

    public RagHelperService(
            LlmMetadataExtractor llmMetadataExtractor,
            SentenceDetector sentenceDetector,
            EmbeddingModel embeddingModel,
            ScoringModel scoringModel,
            JdbcTemplate jdbcTemplate, LlmQueryPlanner llmQueryPlanner
    ) {
        this.llmMetadataExtractor = llmMetadataExtractor;
        this.sentenceDetector = sentenceDetector;
        this.embeddingModel = embeddingModel;
        this.scoringModel = scoringModel;
        this.jdbcTemplate = jdbcTemplate;
        this.llmQueryPlanner = llmQueryPlanner;
    }

    public List<String> planQueries(String query) {
        query = sanitizeContent(query);
        if (!splitUserQuery) {
            return List.of(query);
        }

        try {
            String rawResponse = llmQueryPlanner.splitQuery(query);
            System.out.println(rawResponse);

            return Arrays.stream(rawResponse.split("\n"))
                    .map(s -> s.replaceAll("^\\d+\\.\\s*", "").trim())
                    .filter(q -> !q.isEmpty())
                    .toList();
        } catch (Exception e) {
            ragLogger.error("llmQueryPlanner", e);
            return List.of(query);
        }
    }

    private String sanitizeContent(String content) {
        var cleaned = LINE_BREAKS.matcher(content).replaceAll(" ");
        cleaned = MULTI_SPACES.matcher(cleaned).replaceAll(" ").trim();
        return caseInsensitive ? cleaned.toLowerCase(Locale.ENGLISH) : cleaned;
    }

    public List<ContentChunk> getContentChunks(String content) {
        if (content == null || content.isEmpty()) {
            return List.of();
        }

        var sentences = sentenceDetector.sentDetect(sanitizeContent(content));
        var chunks = new ArrayList<ContentChunk>(sentences.length / 2);
        var currentChunk = new StringBuilder(maxChunkSize);

        for (var sentence : sentences) {
            if (!currentChunk.isEmpty() && (currentChunk.length() + sentence.length() > maxChunkSize)) {
                chunks.add(getContentChunk(currentChunk.toString(), extractMetadata));
                currentChunk.setLength(0);
            }
            currentChunk.append(sentence).append(" ");
        }

        if (!currentChunk.isEmpty()) {
            chunks.add(getContentChunk(currentChunk.toString(), extractMetadata));
        }
        return chunks;
    }

    public Optional<float[]> getEmbeddingVector(String content) {
        if (content.isEmpty()) {
            ragLogger.error("No valid content/chunk found. size: {}", 0);
            return Optional.empty();
        }

        try {
            var vector = embeddingModel.embed(content).content().vector();
            if (normalizeVector) {
                normalizeVector(vector);
            }
            return Optional.of(vector);
        } catch (Exception e) {
            ragLogger.error("Failed to get embedding for content", e);
            return Optional.empty();
        }
    }

    private void normalizeVector(float[] vector) {
        var sumOfSquares = 0.0;
        for (var value : vector) {
            sumOfSquares += value * value;
        }

        if (sumOfSquares == 0.0) {
            return;
        }

        var inverseOfVectorNorm = 1.0 / Math.sqrt(sumOfSquares);
        for (var i = 0; i < vector.length; i++) {
            vector[i] *= (float) inverseOfVectorNorm;
        }
    }

    public String getEmbeddingVectorString(String query) {
        var embeddingVector = getEmbeddingVector(query);
        if (embeddingVector.isEmpty() || embeddingVector.get().length == 0) {
            return "";
        }
        return floatArrayToVectorString(embeddingVector.get());
    }

    public List<String> getRerankedContents(List<ScoredContent> candidates) {
        var ss = candidates.stream();
//                .sorted(Comparator.comparing(ScoredContent::score).reversed());

        if (applyReranking) {
            ss = ss.filter(sc -> sc.score() >= rerankScoreThreshold)
                    .limit(rerankResultLimit);
        }

        return ss.map(ScoredContent::content)
                .toList();
    }

//    public List<String> getRerankedContents(List<String> candidates, String query) {
//        if (applyReranking) {
//            return getScoredContents(candidates, query).stream()
//                    .sorted(Comparator.comparing(ScoredContent::score).reversed())
//                    .filter(sc -> sc.score() >= rerankScoreThreshold)
//                    .limit(rerankResultLimit)
//                    .map(ScoredContent::content)
//                    .toList();
//        }
//        return candidates;
//    }

    public List<String> retrieveDbQueryResults(VectorStoreRepository storeRepository, String storePrefix, String vectorString) {
        if (vectorString.isEmpty()) {
            return List.of();
        }

       return storeRepository.getContentChunksFromVectorStore(storePrefix, vectorString, similarityThreshold, queryResultLimit);
    }

    public List<ChatMessage> getPromptChatMessages(List<String> storeResults, String query) {
        if (storeResults.isEmpty() || query.isEmpty()) {
            return List.of();
        }
//        if (applyReranking) {
//            storeResults = getRerankedContents(storeResults, query);
//        }
//        if (storeResults.isEmpty()) {
//            return List.of();
//        }

//        var systemPrompt = """
//                You are a helpful retrieval QA assistant.
//
//                Rules:
//                1. Answer ONLY using the information provided in the context below.
//                2. If the context contains relevant information, use it to answer the question clearly and concisely.
//                3. If the context does NOT contain enough information to answer the question, respond with exactly: I don't have enough information to answer this question.
//                4. Do NOT add examples, code, platforms, or implementation details unless explicitly present in the context.
//                """;
//
//        var queryPrompt = String.format("""
//                Context:
//                %s
//                ----------------------------------
//                Question:
//                %s
//                -----------------------------------
//                Answer using only the context above.
//                """, String.join("\n\n", storeResults), query
//        );

        var systemPrompt = String.format("""
                <|system|>
                You are a highly precise retrieval assistant.
                Your goal is to answer questions using ONLY the provided context.
                
                STRICT RULES:
                - Use ONLY the information in the provided Context.
                - If the answer is not in the context, say exactly: %s
                - Keep answers objective and concise.
                <|end|>
                """, invalidQueryMessage
        );

        var queryPrompt = String.format("""
                <|user|>
                CONTEXT:
                %s
                
                QUESTION:
                %s
                
                INSTRUCTION: Answer using the context above. If information is missing, admit it.
                <|end|>
                
                <|assistant|>
                """, String.join("\n\n", storeResults), query
        );

        return List.of(SystemMessage.from(systemPrompt), UserMessage.from(queryPrompt));
    }

    public SseEmitter getSseEmitter(ExecutorService executor, AtomicBoolean isCancelled) {
        var emitter = new SseEmitter(MINUTES.toMillis(sseTimeoutMinute));
        emitter.onCompletion(() -> cleanupSse(executor, isCancelled, "Completion"));
        emitter.onTimeout(() -> cleanupSse(executor, isCancelled, "Timeout"));
        emitter.onError((ex) -> cleanupSse(executor, isCancelled, "Error: " + ex.getMessage()));
        return emitter;
    }

    public void checkSseStatus(AtomicBoolean isCancelled) throws InterruptedException {
        if (isCancelled.get() || Thread.currentThread().isInterrupted()) {
            throw new InterruptedException("Operation cancelled by client.");
        }
    }

    public List<CompletableFuture<String>> getEmbeddingVectorStringsAsync(List<String> subQueries, ExecutorService executor) {
        return subQueries.stream()
                .map(sq -> CompletableFuture.supplyAsync(() -> getEmbeddingVectorString(sq), executor))
                .toList();
    }

//    public CompletableFuture<List<String>> getAllDbResultsAsync(String prefix, List<CompletableFuture<String>> vectorFutures, ExecutorService executor) {
//        var retrievalFutures = vectorFutures.stream()
//                .map(vecFuture -> vecFuture.thenApplyAsync(vec -> retrieveDbQueryResults(prefix, vec), executor))
//                .toList();
//
//        return CompletableFuture.allOf(retrievalFutures.toArray(CompletableFuture[]::new))
//                .thenApply(v -> retrievalFutures.stream()
//                        .flatMap(f -> f.join().stream())
//                        .distinct()
//                        .toList());
//    }

    public void sendSseEvent(SseEmitter emitter, AtomicBoolean isCancelled, AskResponse response) {
        if (isCancelled.get()) {
            return;
        }

        try {
            emitter.send(SseEmitter.event().data(response));
        } catch (IOException | IllegalStateException e) {
            isCancelled.set(true);
            ragLogger.warn("Failed to send event. Closing connection.");
        }
    }

    public StreamingResponseHandler<AiMessage> createSseStreamingHandler(SseEmitter emitter, AtomicBoolean isCancelled, ExecutorService executor) {
        return new StreamingResponseHandler<>() {
            @Override
            public void onNext(String token) {
                if (!isCancelled.get() && token != null) {
                    sendSseEvent(emitter, isCancelled, new AskResponse("message", token));
                }
            }

            @Override
            public void onError(Throwable error) {
                sendSseCompleteEvent(emitter, isCancelled, executor);
                ragLogger.error("Streaming error", error);
            }

            @Override
            public void onComplete(Response<AiMessage> response) {
                sendSseCompleteEvent(emitter, isCancelled, executor);
            }
        };
    }

    public void sendSseCompleteEvent(SseEmitter emitter, AtomicBoolean isCancelled, ExecutorService executor) {
        if (isCancelled.compareAndSet(false, true)) {
            try {
                emitter.send(SseEmitter.event().data(new AskResponse("status", "completed")));
                emitter.complete();
            } catch (Exception ignored) {
            }
        }
        executor.shutdownNow();
    }

    public void cleanupSse(ExecutorService executor, AtomicBoolean isCancelled, String reason) {
        ragLogger.info("Cleaning up RAG resources. Reason: {}", reason);
        isCancelled.set(true);
        executor.shutdownNow();
    }

    public List<ScoredContent> getScoredContents(List<String> candidates, String query, ExecutorService executor) throws Exception {

        if (candidates.isEmpty()) return List.of();

        int batchSize = 10;
        int total = candidates.size();

        var futures = IntStream.range(0, (total + batchSize - 1) / batchSize)
                .mapToObj(i -> {
                    int start = i * batchSize;
                    int end = Math.min(start + batchSize, total);
                    List<String> batch = candidates.subList(start, end);

                    return executor.submit(() -> scoreBatch(batch, query));
                })
                .toList();

        // 2. GATHER: Collect results with Fast-Fail logic
        var allScoredResults = new ArrayList<ScoredContent>(total);

        for (var future : futures) {
            // .get() blocks the Virtual Thread until the batch is ready.
            // If the batch failed, .get() throws ExecutionException HERE.
            // This breaks the loop immediately.
            allScoredResults.addAll(future.get());
        }

        // 3. SORT: Final ranking
        return allScoredResults.stream()
                .sorted(Comparator.comparingDouble(ScoredContent::score).reversed())
                .toList();
    }

    private List<ScoredContent> scoreBatch(List<String> batch, String query) {
        var segments = batch.stream().map(TextSegment::from).toList();
        var scores = scoringModel.scoreAll(segments, query).content();

        return IntStream.range(0, batch.size())
                .mapToObj(i -> new ScoredContent(batch.get(i), scores.get(i)))
                .toList();
    }

    private ContentChunk getContentChunk(String chunk, boolean isExtractMetadata) {
        return new ContentChunk(chunk, (isExtractMetadata) ? getMetadata(chunk) : null);
    }

    private ContentMetadata getMetadata(String content) {
        System.out.println("\n\n\n"+llmMetadataExtractor.extract("Give me meta content as json format for this content:\n\n " + content));

        return llmMetadataExtractor.extract("Give me meta content as json format for this content:\n\n " + content);
    }
}
