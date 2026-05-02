package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.storymap.StoryMapCombined;
import org.neonangellock.azurecanvas.service.abstracts.IContentService;

import java.util.List;

public interface IStoryMapService extends IContentService<StoryMapCombined> {
    List<StoryMapCombined> findStoriesByUser(User user);
    void updateLocationOfStory(StoryMapCombined storyMap, String title, String description);
    List<StoryMapCombined> findNewest();
    List<StoryMapCombined> searchByKeyword(String keyword);
}
