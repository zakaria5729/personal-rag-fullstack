package com.zakaria5729.app.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "knowledge")
public class Knowledge extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequence_gen")
    @SequenceGenerator(name = "sequence_gen", sequenceName = "knowledge_id_seq", allocationSize = 50)
    @Column(name = "id")
    @JsonProperty("id")
    private Integer id;

    @Column(name = "content_preview", length = 200, nullable = false)
    @JsonProperty("content_preview")
    private String contentPreview;

    @Column(name = "source", length = 2048, nullable = false)
    @JsonProperty("source")
    private String source;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    @JsonProperty("content")
    private String content;

    @Column(name = "hash_id", length = 64)
    @JsonProperty("hash_id")
    private String hashId;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getContentPreview() {
        return contentPreview;
    }

    public void setContentPreview(String contentPreview) {
        this.contentPreview = contentPreview;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getHashId() {
        return hashId;
    }

    public void setHashId(String hashId) {
        this.hashId = hashId;
    }
}
