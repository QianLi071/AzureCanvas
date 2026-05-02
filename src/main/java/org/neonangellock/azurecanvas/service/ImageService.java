package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.ItemImage;
import org.neonangellock.azurecanvas.model.TreeholeComment;
import org.neonangellock.azurecanvas.model.TreeholePost;
import org.neonangellock.azurecanvas.model.storymap.StoryMapCombined;

import java.util.List;

public interface ImageService {
    List<String> findByItem(Item item);
    List<String> findByTreeholePost(TreeholePost treeholePost);
    List<ItemImage> findByTreeholeComment(TreeholeComment treeholeComment);
    List<ItemImage> findByStoryMap(StoryMapCombined storyMap);
}
