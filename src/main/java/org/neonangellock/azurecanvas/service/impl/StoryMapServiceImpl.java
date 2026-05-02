package org.neonangellock.azurecanvas.service.impl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.storymap.StoryMapCombined;
import org.neonangellock.azurecanvas.repository.StoryMapCombinedRepository;
import org.neonangellock.azurecanvas.service.AbstractQueryService;
import org.neonangellock.azurecanvas.service.IStoryMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class StoryMapServiceImpl extends AbstractQueryService implements IStoryMapService {
    
    @Autowired
    private StoryMapCombinedRepository repository;

    protected StoryMapServiceImpl(EntityManager entityManager) {
        super(entityManager);
    }

    @Override
    public List<StoryMapCombined> findStoriesByUser(User user) {
        return repository.findByAuthorId(user.getUserId(), PageRequest.of(0, 100)).getContent();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateLocationOfStory(StoryMapCombined storyMap, String title, String description) {
        storyMap.setLocationTitle(title);
        storyMap.setLocationDescription(description);
        repository.save(storyMap);
    }

    @Override
    public List<StoryMapCombined> findNewest(){
        Query query = entityManager.createQuery(
                "SELECT p FROM StoryMapCombined p ORDER BY p.createdAt DESC");
        query.setMaxResults(10);
        return query.getResultList();
    }

    @Override
    public StoryMapCombined findById(UUID id) {
        return repository.findByStoryMapId(id).orElse(null);
    }

    @Override
    public List<StoryMapCombined> findAll() {
        return repository.findAll();
    }

    @Override
    public List<StoryMapCombined> findAllWithRange(int page, int limit) {
        return repository.findAll(PageRequest.of(page - 1, limit, Sort.by("createdAt").descending())).getContent();
    }
    
    public List<StoryMapCombined> findByAuthor(UUID authorId, int page, int limit) {
        return repository.findByAuthorId(authorId, PageRequest.of(page - 1, limit, Sort.by("createdAt").descending())).getContent();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public StoryMapCombined save(StoryMapCombined storyMap) {
        return repository.save(storyMap);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(UUID id) {
        repository.findByStoryMapId(id).ifPresent(s -> repository.delete(s));
    }

    @Override
    public List<StoryMapCombined> searchByKeyword(String keyword) {
        return repository.searchByKeyword(keyword);
    }

    // 线程安全更新点赞数 (使用悲观锁 @Lock 及 乐观锁 @Version)
    @Transactional(rollbackFor = Exception.class)
    public void incrementLikes(UUID storyMapId) {
        StoryMapCombined storyMap = repository.findByStoryMapIdForUpdate(storyMapId)
                .orElseThrow(() -> new RuntimeException("StoryMap not found"));
        storyMap.setLikesCount(storyMap.getLikesCount() + 1);
        repository.save(storyMap);
    }
}
