package org.neonangellock.azurecanvas.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ItemDTO {
    private UUID itemId;
    private String title;
    private String description;
    private BigDecimal price;
    private UUID sellerId;
    private String sellerUsername;
    private String sellerAvatarUrl;
    private OffsetDateTime createdAt;
    private String status;
    private List<String> images;
    private String category;
    private Integer views;
    private String location;
}