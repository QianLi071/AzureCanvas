package org.neonangellock.azurecanvas.service.impl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.neonangellock.azurecanvas.model.*;
import org.neonangellock.azurecanvas.repository.ItemCategoryRepository;
import org.neonangellock.azurecanvas.repository.ItemImageRepository;
import org.neonangellock.azurecanvas.repository.ItemRepository;
import org.neonangellock.azurecanvas.service.AbstractQueryService;
import org.neonangellock.azurecanvas.service.IMarketService;
import org.neonangellock.azurecanvas.service.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MarketServiceImpl extends AbstractQueryService implements IMarketService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ItemCategoryRepository categoryRepository;

    @Autowired
    private ItemImageRepository itemImageRepository;

    @Autowired
    private ImageService imageService;

    protected MarketServiceImpl(EntityManager entityManager) {
        super(entityManager);
    }

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
    public List<Item> findNewest() {
        Query query = entityManager.createQuery(
                "SELECT p FROM Item p WHERE p.createdAt = :lastLogout ORDER BY p.createdAt ASC");

        query.setParameter("lastLogout", OffsetDateTime.now());

        return query.getResultList();
    }

    @Override
    @Transactional
    public void addImages(List<String> urls, Item target){
        if (urls == null || urls.isEmpty() || target == null) return;

        // 1. 去重处理，防止同一事务内重复操作同一 URL
        List<String> uniqueUrls = urls.stream().distinct().toList();

        for (String url : uniqueUrls) {
            UUID imageId = null;
            try {
                imageId = UUID.fromString(url);
            } catch (IllegalArgumentException ignored) {}

            ItemImage itemImage = new ItemImage();
//            if (imageId != null) {
//                // 2. 显式检查数据库中是否已存在该图片，避免 UUID 冲突导致更新失败
//                // 使用 findById 确保获取的是受托管状态或最新的实体
//                itemImage = itemImageRepository.findById(imageId).orElse(new ItemImage());
//                if (itemImage.getImageId() == null) {
//                    itemImage.setImageId(imageId);
//                }
//            } else {
//                itemImage = new ItemImage();
//            }
            itemImage.setImageId(imageId);
            itemImage.setItem(target);
            itemImage.setImageUrl(url);
            itemImage.setUploadedAt(OffsetDateTime.now());
            
            // 3. 使用 saveAndFlush 强制同步到数据库，并在异常发生时立即暴露问题
            // 配合 @Transactional 确保原子性
            itemImageRepository.saveAndFlush(itemImage);
        }
    }

    @Override
    public List<ItemImage> findImagesByItem(Item item) {
        return imageService.findByItem(item);
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