package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
    @NotNull(message = "关联商品不能为空")
    private Item item;

    @Column(name = "imageUrl", nullable = false, length = 255)
    @NotNull(message = "图片URL不能为空")
    @Size(max = 255, message = "图片URL长度不能超过255个字符")
    private String imageUrl;

    @Column(name = "\"order\"")
    private Integer order;

    @CreationTimestamp
    @Column(name = "uploadedAt", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;
}