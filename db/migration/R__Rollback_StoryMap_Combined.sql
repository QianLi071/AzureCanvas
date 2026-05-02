-- R__Rollback_StoryMap_Combined.sql
-- Restore original tables from story_map_combined

-- Restore story_maps
INSERT INTO story_maps (storyMapId, authorId, title, content, coverImageUrl, createdAt, updatedAt)
SELECT story_map_id, author_id, title, content, cover_image_url, created_at, updated_at
FROM story_map_combined;

-- Restore story_map_locations
INSERT INTO story_map_locations (locationId, storyMapId, lat, lng, title, description, imageUrl, s_order, createdAt, updatedAt)
SELECT location_id, story_map_id, lat, lng, location_title, location_description, location_image_url, s_order, created_at, updated_at
FROM story_map_combined;

-- Restore story_map_stats
INSERT INTO story_map_stats (storymapid, authorId, likescount, viewscount, commentcount, created_at, updated_at)
SELECT story_map_id, author_id, likes_count, views_count, comment_count, created_at, updated_at
FROM story_map_combined;

-- Drop the combined table
DROP TABLE IF EXISTS story_map_combined;
