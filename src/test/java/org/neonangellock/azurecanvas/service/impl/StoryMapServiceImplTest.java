package org.neonangellock.azurecanvas.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.neonangellock.azurecanvas.model.storymap.StoryMapCombined;
import org.neonangellock.azurecanvas.repository.StoryMapCombinedRepository;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StoryMapServiceImplTest {

    @Mock
    private StoryMapCombinedRepository repository;

    @Mock
    private jakarta.persistence.EntityManager entityManager;

    private StoryMapServiceImpl service;

    private StoryMapCombined testStoryMap;
    private UUID storyMapId;

    @BeforeEach
    void setUp() {
        service = new StoryMapServiceImpl(entityManager);
        ReflectionTestUtils.setField(service, "repository", repository);

        storyMapId = UUID.randomUUID();
        testStoryMap = StoryMapCombined.builder()
                .storyMapId(storyMapId)
                .locationId(UUID.randomUUID())
                .authorId(UUID.randomUUID())
                .title("Test Story")
                .content("Test Content")
                .lat(new BigDecimal("22.123456"))
                .lng(new BigDecimal("113.123456"))
                .locationTitle("Test Location")
                .likesCount(10)
                .build();
    }

    @Test
    void testSaveStoryMap() {
        when(repository.save(any(StoryMapCombined.class))).thenReturn(testStoryMap);
        
        StoryMapCombined saved = service.save(testStoryMap);
        
        assertNotNull(saved);
        assertEquals(testStoryMap.getTitle(), saved.getTitle());
        verify(repository, times(1)).save(testStoryMap);
    }

    @Test
    void testIncrementLikes_ThreadSafe() {
        when(repository.findByStoryMapIdForUpdate(storyMapId)).thenReturn(Optional.of(testStoryMap));
        when(repository.save(any(StoryMapCombined.class))).thenReturn(testStoryMap);

        service.incrementLikes(storyMapId);

        assertEquals(11, testStoryMap.getLikesCount());
        verify(repository, times(1)).findByStoryMapIdForUpdate(storyMapId);
        verify(repository, times(1)).save(testStoryMap);
    }

    @Test
    void testDeleteStoryMap() {
        when(repository.findByStoryMapId(storyMapId)).thenReturn(Optional.of(testStoryMap));
        doNothing().when(repository).delete(testStoryMap);

        service.deleteById(storyMapId);

        verify(repository, times(1)).findByStoryMapId(storyMapId);
        verify(repository, times(1)).delete(testStoryMap);
    }

    @Test
    void testFindById() {
        when(repository.findByStoryMapId(storyMapId)).thenReturn(Optional.of(testStoryMap));

        StoryMapCombined found = service.findById(storyMapId);

        assertNotNull(found);
        assertEquals(storyMapId, found.getStoryMapId());
    }
}
