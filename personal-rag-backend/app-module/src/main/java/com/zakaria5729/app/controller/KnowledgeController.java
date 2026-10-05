package com.zakaria5729.app.controller;

import com.zakaria5729.app.model.request.AskRequest;
import com.zakaria5729.app.model.request.CreateKnowledgeRequest;
import com.zakaria5729.app.model.request.UpdateKnowledgeRequest;
import com.zakaria5729.app.model.response.ApiResponse;
import com.zakaria5729.app.service.KnowledgeService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.OK;

@RestController
@RequestMapping("/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse> create(@Valid @RequestBody CreateKnowledgeRequest request) {
        var savedKnowledge = knowledgeService.create(request.content(), request.type());
        return ResponseEntity.ok(new ApiResponse("Knowledge Saved!", savedKnowledge));
    }

    @PostMapping(value = "/create/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse> createWithPdf(@RequestParam("pdf_file") MultipartFile pdfFile) {
        if (pdfFile.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse("File is empty. Please upload a valid PDF.", null));
        }

        var savedKnowledge = knowledgeService.createViaPdf(pdfFile);
        return ResponseEntity.ok(new ApiResponse("Knowledge Saved!", savedKnowledge));
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponse> update(@RequestParam("id") int id, @Valid @RequestBody UpdateKnowledgeRequest request) {
        var updatedKnowledge = knowledgeService.update(id, request.content());
        return ResponseEntity.ok(new ApiResponse("Knowledge Updated!", updatedKnowledge));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse> delete(@RequestParam("id") int id) {
        var isDeleted = knowledgeService.delete(id);
        return new ResponseEntity<>(new ApiResponse(isDeleted ? "Knowledge Deleted!" : "Failed to delete knowledge!", null), isDeleted ? OK : BAD_REQUEST);
    }

    @GetMapping("/id")
    public ResponseEntity<ApiResponse> getOneById(@RequestParam("id") int id) {
        var knowledge = knowledgeService.findOneById(id);
        return new ResponseEntity<>(new ApiResponse(knowledge != null ? "Knowledge found!" : "Knowledge not found!", knowledge), knowledge != null ? OK : BAD_REQUEST);
    }

    @GetMapping(path = "/all")
    public ResponseEntity<ApiResponse> getAll(@RequestParam(name = "after_id", required = false) Integer afterId, @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(new ApiResponse("All knowledge data", knowledgeService.getAllPaginated(afterId, size)));
    }

    @GetMapping(path = "/vector")
    public ResponseEntity<ApiResponse> getAllByHashId(@RequestParam("hash_id") String hashId) {
        return ResponseEntity.ok(new ApiResponse("All knowledge vector data", knowledgeService.getAllByHashId(hashId)));
    }

    @PostMapping(path = "/ask", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter askQuery(@Valid @RequestBody AskRequest request) {
        return knowledgeService.askQuery(request);
    }
}
