package com.zakaria5729.app.service;

import com.zakaria5729.app.ContentSource;
import com.zakaria5729.app.entity.Knowledge;
import com.zakaria5729.app.exception.AlreadyExistsException;
import com.zakaria5729.app.exception.AppDataAccessException;
import com.zakaria5729.app.exception.NotFoundException;
import com.zakaria5729.app.exception.ResponseException;
import com.zakaria5729.app.model.projection.KnowledgeContentPreview;
import com.zakaria5729.app.model.request.AskRequest;
import com.zakaria5729.app.model.response.PaginatedResponse;
import com.zakaria5729.app.repository.KnowledgeRepository;
import com.zakaria5729.library.rag.RagBuilder;
import com.zakaria5729.library.rag.model.projection.VectorStoreContent;
import com.zakaria5729.library.rag.model.response.RagResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class KnowledgeService {

    private final KnowledgeRepository knowledgeRepository;
    private final RagBuilder ragBuilder;

    public KnowledgeService(KnowledgeRepository knowledgeRepository, RagBuilder ragBuilder) {
        this.knowledgeRepository = knowledgeRepository;
        this.ragBuilder = ragBuilder;
    }

    private final Pattern LINE_BREAKS = Pattern.compile("\\R");
    private final Pattern MULTI_SPACES = Pattern.compile("\\s{2,}");

    @Transactional
    public Knowledge create(String content, ContentSource source) {
        if (knowledgeRepository.existsByContent(content)) {
            throw new AlreadyExistsException("This content already exists in the knowledge");
        }
        if (source == ContentSource.PDF) {
            throw new ResponseException("Invalid type provided");
        }

        RagResponse ragResponse;
        if (source == ContentSource.URL) {
            ragResponse = ragBuilder.insertFromUrlToStore(content);
        } else {
            content = sanitizeContent(content);
            ragResponse = ragBuilder.insertTextToStore(content);
        }
        return saveKnowledge(content, source.name(), new Knowledge(), ragResponse);
    }

    @Transactional
    public Knowledge createViaPdf(MultipartFile pdfFile) {
        String originalFileName = pdfFile.getOriginalFilename();
        if (originalFileName == null || originalFileName.isEmpty()) {
            throw new IllegalArgumentException("Could not determine the file name.");
        }
        if (knowledgeRepository.existsByContent(originalFileName)) {
            throw new AlreadyExistsException("This content already exists in the knowledge");
        }

        var ragResponse = ragBuilder.insertFromPdfToStore(pdfFile);
        return saveKnowledge(originalFileName, ContentSource.PDF.name(), new Knowledge(), ragResponse);
    }

    @Transactional
    public Knowledge update(Integer id, String content) {
        var knowledgeOpt = knowledgeRepository.findById(id);
        if (knowledgeOpt.isEmpty()) {
            throw new NotFoundException();
        }

        if (knowledgeRepository.existsByContentAndIdNot(content, id)) {
            throw new AlreadyExistsException("This content already exists with another item");
        }

        content = sanitizeContent(content);
        var ragResponse = ragBuilder.updateToStore(knowledgeOpt.get().getHashId(), content);
        return saveKnowledge(content, knowledgeOpt.get().getSource(), knowledgeOpt.get(), ragResponse);
    }

    @Transactional
    public boolean delete(Integer id) {
        var knowledgeOpt = knowledgeRepository.findById(id);
        if (knowledgeOpt.isEmpty()) {
            throw new NotFoundException();
        }

        var knowledge = knowledgeOpt.get();
        boolean vectorDeleted = ragBuilder.deleteAllByHashIdFromStore(knowledge.getHashId());
        boolean knowledgeDeleted = knowledgeRepository.deleteAllById(id) > 0;

        if (!vectorDeleted || !knowledgeDeleted) {
            throw new AppDataAccessException("Delete failed");
        }
        return true;
    }

    public Knowledge findOneById(int id) {
        return knowledgeRepository.findById(id).orElse(null);
    }

    // Slice automatically handles the "size + 1" logic internally
    public PaginatedResponse<KnowledgeContentPreview> getAllPaginated(Integer cursorId, int size) {
        Slice<KnowledgeContentPreview> slices;
        var pageable = PageRequest.of(0, size, Sort.by("id").descending());

        if (cursorId == null || cursorId <= 0) {
            slices = knowledgeRepository.findAllProjectedBy(pageable);
        } else {
            slices = knowledgeRepository.findByIdLessThan(cursorId, pageable);
        }

        var nextCursorId = slices.hasNext() ? slices.getContent().getLast().getId() : 0;
        return new PaginatedResponse<>(slices.getContent(), nextCursorId, slices.hasNext());
    }

    public List<VectorStoreContent> getAllByHashId(String hashId) {
        return ragBuilder.findAllByHashIdFromStore(hashId);
    }

    public SseEmitter askQuery(AskRequest request) {
        String sanitizedQuery = sanitizeContent(request.query());
        return ragBuilder.ask(sanitizedQuery);
    }

    private String sanitizeContent(String content) {
        var cleaned = LINE_BREAKS.matcher(content).replaceAll(" ");
        return MULTI_SPACES.matcher(cleaned).replaceAll(" ").trim();
    }

    private Knowledge saveKnowledge(String content, String source, Knowledge knowledge, RagResponse ragResponse) {
        if (ragResponse.hashId() == null || ragResponse.hashId().isEmpty()) {
            throw new ResponseException(ragResponse.message());
        }

        var preview = content;
        if (content.length() > 200) {
            preview = content.substring(0, 217) + "...";
        }

        knowledge.setHashId(ragResponse.hashId());
        knowledge.setContent(content);
        knowledge.setSource(source);
        knowledge.setContentPreview(preview);
        knowledge = knowledgeRepository.save(knowledge);
        return knowledge;
    }
}
