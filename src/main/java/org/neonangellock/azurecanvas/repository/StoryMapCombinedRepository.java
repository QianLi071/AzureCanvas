package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.storymap.StoryMapCombined;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryMapCombinedRepository extends JpaRepository<StoryMapCombined, Long> {

    Optional<StoryMapCombined> findByStoryMapId(UUID storyMapId);

    Page<StoryMapCombined> findByAuthorId(UUID authorId, Pageable pageable);

    @Query("SELECT s FROM StoryMapCombined s WHERE s.title LIKE %?1% OR s.content LIKE %?1% OR s.locationTitle LIKE %?1% OR s.locationDescription LIKE %?1%")
    List<StoryMapCombined> searchByKeyword(String keyword);

    // 原有查询条件覆盖：location_code, status, likes_count 范围
    List<StoryMapCombined> findByLocationCodeAndStatusAndLikesCountBetween(String locationCode, String status, int minLikes, int maxLikes);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM StoryMapCombined s WHERE s.storyMapId = :storyMapId")
    Optional<StoryMapCombined> findByStoryMapIdForUpdate(UUID storyMapId);
}
