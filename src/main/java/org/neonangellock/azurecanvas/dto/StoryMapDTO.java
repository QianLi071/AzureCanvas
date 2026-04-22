package org.neonangellock.azurecanvas.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class StoryMapDTO {
    private UUID storyMapId;
    private String title;
    private String description;
    private UUID authorId;
    private String author; // author name
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private String coverImageUrl;
    private List<LocationDTO> locations;
    private Integer likes;
    private String comments;
    private BigDecimal lat;
    private BigDecimal lng;
    private String category;
    private String location;

    @Data
    @Builder
    public static class LocationDTO {
        private UUID locationId;
        private BigDecimal lat;
        private BigDecimal lng;
        private String title;
        private String description;
        private String imageUrl;
    }
}