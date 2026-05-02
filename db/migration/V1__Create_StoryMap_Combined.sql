-- V1__Create_StoryMap_Combined.sql
CREATE TABLE IF NOT EXISTS story_map_combined (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    story_map_id BINARY(16) NOT NULL,
    location_id BINARY(16) NOT NULL,
    author_id BINARY(16) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    cover_image_url VARCHAR(255),
    lat DECIMAL(10,8) NOT NULL,
    lng DECIMAL(11,8) NOT NULL,
    location_title VARCHAR(255) NOT NULL,
    location_description TEXT,
    location_image_url VARCHAR(255),
    s_order INT,
    likes_count INT DEFAULT 0 NOT NULL,
    views_count INT DEFAULT 0 NOT NULL,
    comment_count INT DEFAULT 0 NOT NULL,
    location_code VARCHAR(50),
    status VARCHAR(20),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    version BIGINT DEFAULT 0 NOT NULL,
    UNIQUE KEY uk_story_map_id (story_map_id),
    UNIQUE KEY uk_location_id (location_id),
    INDEX idx_location_code_status_likes (location_code, status, likes_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate data from original tables
-- We assume a 1:1 relationship between StoryMap and StoryMapLocation for this migration.
-- If there are multiple locations, we take the one with the smallest locationId.
INSERT INTO story_map_combined (
    story_map_id, location_id, author_id, title, content, cover_image_url,
    lat, lng, location_title, location_description, location_image_url, s_order,
    likes_count, views_count, comment_count,
    created_at, updated_at
)
SELECT 
    sm.storyMapId, sl.locationId, sm.authorId, sm.title, sm.content, sm.coverImageUrl,
    sl.lat, sl.lng, sl.title, sl.description, sl.imageUrl, sl.s_order,
    COALESCE(ss.likescount, 0), COALESCE(ss.viewscount, 0), COALESCE(ss.commentcount, 0),
    sm.createdAt, sm.updatedAt
FROM story_maps sm
JOIN story_map_locations sl ON sm.storyMapId = sl.storyMapId
LEFT JOIN story_map_stats ss ON sm.storyMapId = ss.storymapid
WHERE sl.locationId = (
    SELECT MIN(sl2.locationId) 
    FROM story_map_locations sl2 
    WHERE sl2.storyMapId = sm.storyMapId
);
