package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.ItemCategory;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.repository.ItemCategoryRepository;
import org.neonangellock.azurecanvas.repository.ItemRepository;
import org.neonangellock.azurecanvas.service.IMarketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MarketServiceImpl implements IMarketService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ItemCategoryRepository categoryRepository;

    @Override
    public Page<Item> findAllItems(String category, String sortBy, String order, int page, int limit, String search) {
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.isEmpty()) {
            sort = Sort.by(sortBy);
            if ("desc".equalsIgnoreCase(order)) {
                sort = sort.descending();
            } else {
                sort = sort.ascending();
            }
        } else {
            sort = Sort.by("createdAt").descending();
        }

        Pageable pageable = PageRequest.of(page - 1, limit, sort);

        if (search != null && !search.isEmpty()) {
            return itemRepository.searchItems(search, pageable);
        } else if (category != null && !category.isEmpty()) {
            return itemRepository.findByCategory(category, pageable);
        } else {
            return itemRepository.findAll(pageable);
        }
    }

    @Override
    public Item findItemById(UUID itemId) {
        return itemRepository.findById(itemId).orElse(null);
    }

    @Override
    @Transactional
    public Item saveItem(Item item) {
        return itemRepository.save(item);
    }

    @Override
    @Transactional
    public void deleteItem(UUID itemId) {
        itemRepository.deleteById(itemId);
    }

    @Override
    public Page<Item> findItemsBySeller(User seller, String status, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        if (status != null && !status.isEmpty()) {
            return itemRepository.findBySellerAndStatus(seller, status, pageable);
        }
        return itemRepository.findBySeller(seller, pageable);
    }

    @Override
    public List<ItemCategory> findAllCategories() {
        return categoryRepository.findAll();
    }
}