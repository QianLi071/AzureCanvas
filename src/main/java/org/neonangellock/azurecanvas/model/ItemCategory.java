package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "item_categories")
@Getter @Setter
public class ItemCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "categoryId", updatable = false, nullable = false)
    private UUID categoryId;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;
}