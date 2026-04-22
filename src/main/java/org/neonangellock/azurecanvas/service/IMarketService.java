package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.ItemCategory;
import org.neonangellock.azurecanvas.model.User;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface IMarketService {
    Page<Item> findAllItems(String category, String sortBy, String order, int page, int limit, String search);
    Item findItemById(UUID itemId);
    Item saveItem(Item item);
    void deleteItem(UUID itemId);
    Page<Item> findItemsBySeller(User seller, String status, int page, int limit);
    List<ItemCategory> findAllCategories();
}