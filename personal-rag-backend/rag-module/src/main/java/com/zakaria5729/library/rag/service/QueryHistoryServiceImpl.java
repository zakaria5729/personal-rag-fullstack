package com.zakaria5729.library.rag.service;

import com.zakaria5729.library.rag.exception.NotFoundException;
import com.zakaria5729.library.rag.model.ContentChunk;
import com.zakaria5729.library.rag.model.projection.VectorStoreContent;
import com.zakaria5729.library.rag.model.response.AskResponse;
import com.zakaria5729.library.rag.model.response.RagResponse;
import com.zakaria5729.library.rag.repository.QueryHistoryRepository;
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
class QueryHistoryServiceImpl implements QueryHistoryService {

    private final RagHelperService ragHelperService;
    private final StreamingChatLanguageModel streamingChatModel;
    private final QueryHistoryRepository queryHistoryRepository;

    public QueryHistoryServiceImpl(
            RagHelperService ragHelperService,
            StreamingChatLanguageModel streamingChatModel,
            QueryHistoryRepository queryHistoryRepository
    ) {
        this.ragHelperService = ragHelperService;
        this.streamingChatModel = streamingChatModel;
        this.queryHistoryRepository = queryHistoryRepository;
    }

    @Override
    public void init() {
        queryHistoryRepository.createQueryHistoryTableAndIndexesIfNotExists(DEFAULT_STORE_PREFIX);
    }

    @Override
    public void init(String storePrefix) {
        queryHistoryRepository.createQueryHistoryTableAndIndexesIfNotExists(storePrefix);
    }

    @Override
    public RagResponse insertToQueryHistory(String query) {
        return null;
    }

    @Override
    public RagResponse insertToQueryHistory(String storePrefix, String query) {
        return null;
    }
}
