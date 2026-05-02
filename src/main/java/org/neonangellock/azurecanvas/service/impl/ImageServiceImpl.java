package org.neonangellock.azurecanvas.service.impl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.ItemImage;
import org.neonangellock.azurecanvas.model.TreeholeComment;
import org.neonangellock.azurecanvas.model.TreeholePost;
import org.neonangellock.azurecanvas.model.TreeholeImage;
import org.neonangellock.azurecanvas.model.storymap.StoryMapCombined;
import org.neonangellock.azurecanvas.service.AbstractQueryService;
import org.neonangellock.azurecanvas.service.ImageService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ImageServiceImpl extends AbstractQueryService implements ImageService {
    protected ImageServiceImpl(EntityManager entityManager) {
        super(entityManager);
    }

    @Override
    public List<String> findByItem(Item item) {
        Query query = entityManager.createQuery("select im from ItemImage im where im.itemId = :targetId");
        query.setParameter("targetId", item.getItemId());
        List<String> itemImages = new ArrayList<>();
        query.getResultList().forEach((itemImage)->{
            itemImages.add("/resources/"+((ItemImage)itemImage).getImageUrl());
        });
        return itemImages;
    }

    @Override
    public List<String> findByTreeholePost(TreeholePost treeholePost) {
        Query query = entityManager.createQuery("select im from TreeholeImage im where im.postId = :targetId");
        query.setParameter("targetId", treeholePost.getId());
        List<String> postImages = new ArrayList<>();
        query.getResultList().forEach((treeholeImage)->{
            postImages.add("/resources/"+((TreeholeImage)treeholeImage).getImageUrl());
        });
        return postImages;
    }

    @Override
    public List<ItemImage> findByTreeholeComment(TreeholeComment treeholeComment) {
        return null;
    }

    @Override
    public List<ItemImage> findByStoryMap(StoryMapCombined storyMap) {
        return null;
    }
}
