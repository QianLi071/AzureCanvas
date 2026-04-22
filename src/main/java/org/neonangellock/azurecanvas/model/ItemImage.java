package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "item_images")
@Getter @Setter
public class ItemImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "imageId", updatable = false, nullable = false)
    private UUID imageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itemId", nullable = false)
    private Item item;

    @Column(name = "imageUrl", nullable = false, length = 255)
    private String imageUrl;

    @Column(name = "\"order\"")
    private Integer order;

    @CreationTimestamp
    @Column(name = "uploadedAt", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;
}