package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.ItemCategory;
import org.neonangellock.azurecanvas.model.ItemImage;
import org.neonangellock.azurecanvas.model.User;
import org.springframework.data.domain.Page;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface IMarketService {
    Page<Item> findAllItems(String category, String sortBy, String order, int page, int limit, String search);
    Item findItemById(UUID itemId);
    Item saveItem(Item item);
    void deleteItem(UUID itemId);
    void addImages(List<String> urls, UUID item);
    List<String> findImagesByItem(Item item);
    List<Item> findNewest();
    Page<Item> findItemsBySeller(User seller, String status, int page, int limit);
    List<ItemCategory> findAllCategories();
}