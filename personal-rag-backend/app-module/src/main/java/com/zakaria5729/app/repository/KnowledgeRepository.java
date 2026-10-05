package com.zakaria5729.app.repository;

import com.zakaria5729.app.entity.Knowledge;
import com.zakaria5729.app.model.projection.KnowledgeContentPreview;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface KnowledgeRepository extends JpaRepository<Knowledge, Integer> {

    @Query(value = "SELECT EXISTS (SELECT 1 FROM knowledge WHERE digest(content, 'sha256') = digest(:content, 'sha256'))", nativeQuery = true)
    boolean existsByContent(@Param("content") String content);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM knowledge WHERE digest(content, 'sha256') = digest(:content, 'sha256') AND id != :id)", nativeQuery = true)
    boolean existsByContentAndIdNot(@Param("content") String content, @Param("id") Integer id);

    @Modifying
    @Query("DELETE FROM Knowledge k WHERE k.id = :id")
    int deleteAllById(@Param("id") Integer id);

    Slice<KnowledgeContentPreview> findAllProjectedBy(Pageable pageable);

    Slice<KnowledgeContentPreview> findByIdLessThan(Integer cursorId, Pageable pageable);
}
