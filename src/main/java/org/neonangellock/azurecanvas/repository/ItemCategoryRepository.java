package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.ItemCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ItemCategoryRepository extends JpaRepository<ItemCategory, UUID> {
    ItemCategory findByName(String name);
}