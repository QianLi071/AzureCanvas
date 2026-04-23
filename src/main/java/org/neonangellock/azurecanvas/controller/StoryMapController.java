package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.dto.StoryMapDTO;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.storymap.StoryMap;
import org.neonangellock.azurecanvas.model.storymap.StoryMapLocation;
import org.neonangellock.azurecanvas.service.UserService;
import org.neonangellock.azurecanvas.service.impl.StoryMapServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class StoryMapController {

    @Autowired
    private StoryMapServiceImpl service;

    @Autowired
    private UserService userService;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username);
    }

    @GetMapping("/storymaps")
    public ResponseEntity<List<StoryMapDTO>> getAllStoryMaps(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        List<StoryMap> storyMaps = service.findAllWithRange(page, limit);
        return ResponseEntity.ok(storyMaps.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/users/me/storymaps")
    public ResponseEntity<List<StoryMapDTO>> getMyStoryMaps(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        User currentUser = getCurrentUser();
        List<StoryMap> storyMaps = service.findByAuthor(currentUser.getUserId(), page, limit);
        return ResponseEntity.ok(storyMaps.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/storymaps/{storyMapId}")
    public ResponseEntity<StoryMapDTO> getStoryMapDetail(@PathVariable UUID storyMapId) {
        StoryMap storyMap = service.findById(storyMapId);
        if (storyMap == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(convertToDTO(storyMap));
    }

    @PostMapping("/storymaps")
    public ResponseEntity<?> createStoryMap(@RequestBody Map<String, Object> request) {
        User user = getCurrentUser();

        if (user != null) {
            StoryMap storyMap = new StoryMap();
            storyMap.setTitle((String) request.get("title"));
            storyMap.setContent((String) request.get("description"));
            storyMap.setCoverImageUrl((String) request.get("coverImageUrl"));
            storyMap.setAuthorId(user.getUserId());
            storyMap.setCreatedAt(OffsetDateTime.now());
            storyMap.setUpdatedAt(OffsetDateTime.now());

            StoryMapLocation location = new StoryMapLocation();
            location.setStoryMap(storyMap);
            location.setLng(new BigDecimal(String.valueOf(request.get("lng"))));
            location.setLat(new BigDecimal(String.valueOf(request.get("lat"))));
            location.setCreatedAt(OffsetDateTime.now());
            location.setUpdatedAt(OffsetDateTime.now());
            location.setTitle((String) request.get("title"));
            location.setDescription((String) request.get("description"));
            storyMap.setLocations(List.of(location));

            StoryMap saved = service.save(storyMap);

            System.out.println(";map" + storyMap);
            System.out.println("location" + location);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(saved));
        }
        else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "NOT_LOGGED_IN", "redirect", "/login/index.html?redirect=/storymap/compusmap.html"));
        }
    }

    @PutMapping("/storymaps/{storyMapId}")
    public ResponseEntity<StoryMapDTO> updateStoryMap(
            @PathVariable UUID storyMapId,
            @RequestBody Map<String, Object> request) {
        
        StoryMap storyMap = service.findById(storyMapId);
        if (storyMap == null) return ResponseEntity.notFound().build();
        
        if (request.containsKey("title")) storyMap.setTitle((String) request.get("title"));
        if (request.containsKey("description")) storyMap.setContent((String) request.get("description"));
        
        StoryMap updated = service.save(storyMap);
        return ResponseEntity.ok(convertToDTO(updated));
    }

    @DeleteMapping("/storymaps/{storyMapId}")
    public ResponseEntity<Map<String, Object>> deleteStoryMap(@PathVariable UUID storyMapId) {
        service.deleteById(storyMapId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Story map deleted successfully."));
    }

    private StoryMapDTO convertToDTO(StoryMap storyMap) {
        User author = userService.findById(storyMap.getAuthorId());
        String authorName = author != null ? author.getUsername() : "Unknown";

        List<StoryMapDTO.LocationDTO> locations = Collections.emptyList();
        if (storyMap.getLocations() != null) {
            locations = storyMap.getLocations().stream()
                    .map(loc -> StoryMapDTO.LocationDTO.builder()
                            .locationId(loc.getLocationId())
                            .lat(loc.getLat())
                            .lng(loc.getLng())
                            .title(loc.getTitle())
                            .description(loc.getDescription())
                            .imageUrl(loc.getImageUrl())
                            .build())
                    .collect(Collectors.toList());
        }

        return StoryMapDTO.builder()
                .storyMapId(storyMap.getStoryMapId())
                .title(storyMap.getTitle())
                .description(storyMap.getContent())
                .authorId(storyMap.getAuthorId())
                .author(authorName)
                .createdAt(storyMap.getCreatedAt())
                .updatedAt(storyMap.getUpdatedAt())
                .coverImageUrl(storyMap.getCoverImageUrl())
                .locations(locations)
                .likes(storyMap.getStats() != null ? storyMap.getStats().getLikesCount() : 0)
                .comments(storyMap.getStats() != null ? String.valueOf(storyMap.getStats().getCommentCount()) : "0")
                .build();
    }
}