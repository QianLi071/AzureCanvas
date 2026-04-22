package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.storymap.StoryMap;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StoryMapRepository extends JpaRepository<StoryMap, UUID> {
    Page<StoryMap> findByAuthorId(UUID authorId, Pageable pageable);
}