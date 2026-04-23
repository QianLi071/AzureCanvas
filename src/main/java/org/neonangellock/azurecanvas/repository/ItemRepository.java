package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ItemRepository extends JpaRepository<Item, UUID> {
    Page<Item> findByCategory(String category, Pageable pageable);
    
    @Query("SELECT i FROM Item i WHERE lower(i.title) LIKE lower(concat('%', :search, '%')) OR lower(i.description) LIKE lower(concat('%', :search, '%'))")
    Page<Item> searchItems(@Param("search") String search, Pageable pageable);
    
    Page<Item> findBySeller(User seller, Pageable pageable);
    
    Page<Item> findBySellerAndStatus(User seller, String status, Pageable pageable);
}