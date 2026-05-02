package org.neonangellock.azurecanvas.model.storymap;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "story_map_combined", indexes = {
    @Index(name = "idx_location_code_status_likes", columnList = "location_code, status, likes_count")
})
//@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class StoryMapCombined {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "story_map_id", nullable = false, unique = true)
    private UUID storyMapId;

    @Column(name = "location_id", nullable = false, unique = true)
    private UUID locationId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal lat;

    @Column(nullable = false, precision = 11, scale = 8)
    private BigDecimal lng;

    @Column(name = "location_title", nullable = false)
    private String locationTitle;

    @Column(name = "location_description", columnDefinition = "TEXT")
    private String locationDescription;

    @Column(name = "location_image_url")
    private String locationImageUrl;

    @Column(name = "s_order")
    private Integer sOrder;

    @Column(name = "likes_count", nullable = false)
    private int likesCount = 0;

    @Column(name = "views_count", nullable = false)
    private int viewsCount = 0;

    @Column(name = "comment_count", nullable = false)
    private int commentCount = 0;

    @Column(name = "location_code", length = 50)
    private String locationCode;

    @Column(length = 20)
    private String status;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Version
    private Long version = 0L;
}
