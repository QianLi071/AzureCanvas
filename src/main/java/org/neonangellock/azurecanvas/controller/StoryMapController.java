package org.neonangellock.azurecanvas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.neonangellock.azurecanvas.dto.StoryMapDTO;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.storymap.StoryMapCombined;
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
@Tag(name = "StoryMap", description = "校园地图故事相关接口")
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
    @Operation(summary = "获取所有故事地图", description = "分页获取系统中的所有故事地图")
    public ResponseEntity<List<StoryMapDTO>> getAllStoryMaps(
            @RequestParam(defaultValue = "1") @Parameter(description = "页码") int page,
            @RequestParam(defaultValue = "10") @Parameter(description = "每页数量") int limit) {
        
        List<StoryMapCombined> storyMaps = service.findAllWithRange(page, limit);
        return ResponseEntity.ok(storyMaps.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/users/me/storymaps")
    @Operation(summary = "获取我的故事地图", description = "获取当前登录用户发布的地图")
    public ResponseEntity<List<StoryMapDTO>> getMyStoryMaps(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        User currentUser = getCurrentUser();
        List<StoryMapCombined> storyMaps = service.findByAuthor(currentUser.getUserId(), page, limit);
        return ResponseEntity.ok(storyMaps.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/storymaps/{storyMapId}")
    @Operation(summary = "获取地图详情", responses = {
            @ApiResponse(responseCode = "200", description = "成功"),
            @ApiResponse(responseCode = "404", description = "未找到")
    })
    public ResponseEntity<StoryMapDTO> getStoryMapDetail(@PathVariable UUID storyMapId) {
        StoryMapCombined storyMap = service.findById(storyMapId);
        if (storyMap == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(convertToDTO(storyMap));
    }

    @PostMapping("/storymaps")
    @Operation(summary = "创建新地图", responses = {
            @ApiResponse(responseCode = "201", description = "创建成功"),
            @ApiResponse(responseCode = "401", description = "未登录")
    })
    public ResponseEntity<?> createStoryMap(@RequestBody Map<String, Object> request,
                                            @CookieValue(name = "user_id", required = false) UUID userId) {
        User user = userService.findById(userId);

        if (user != null) {
            StoryMapCombined storyMap = StoryMapCombined.builder()
                    .storyMapId(UUID.randomUUID())
                    .locationId(UUID.randomUUID())
                    .authorId(user.getUserId())
                    .title((String) request.get("title"))
                    .content((String) request.get("description"))
                    .coverImageUrl((String) request.get("coverImageUrl"))
                    .lat(new BigDecimal(String.valueOf(request.get("lat"))))
                    .lng(new BigDecimal(String.valueOf(request.get("lng"))))
                    .locationTitle((String) request.get("title"))
                    .locationDescription((String) request.get("description"))
                    .likesCount(0)
                    .viewsCount(0)
                    .commentCount(0)
                    .createdAt(OffsetDateTime.now())
                    .updatedAt(OffsetDateTime.now())
                    .build();

            StoryMapCombined saved = service.save(storyMap);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(saved));
        }
        else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "NOT_LOGGED_IN", "redirect", "/login/index.html?redirect=/storymap/compusmap.html"));
        }
    }

    @PutMapping("/storymaps/{storyMapId}")
    @Operation(summary = "更新地图信息")
    public ResponseEntity<StoryMapDTO> updateStoryMap(
            @PathVariable UUID storyMapId,
            @RequestBody Map<String, Object> request) {
        
        StoryMapCombined storyMap = service.findById(storyMapId);
        if (storyMap == null) return ResponseEntity.notFound().build();
        
        if (request.containsKey("title")) storyMap.setTitle((String) request.get("title"));
        if (request.containsKey("description")) storyMap.setContent((String) request.get("description"));
        if (request.containsKey("lat")) storyMap.setLat(new BigDecimal(String.valueOf(request.get("lat"))));
        if (request.containsKey("lng")) storyMap.setLng(new BigDecimal(String.valueOf(request.get("lng"))));
        
        StoryMapCombined updated = service.save(storyMap);
        return ResponseEntity.ok(convertToDTO(updated));
    }

    @DeleteMapping("/storymaps/{storyMapId}")
    @Operation(summary = "删除地图")
    public ResponseEntity<Map<String, Object>> deleteStoryMap(@PathVariable UUID storyMapId, @CookieValue(name = "user_id", required = false) UUID userId) {
        User user = userService.findById(userId);
        if (user != null) {
            service.deleteById(storyMapId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Story map deleted successfully."));
        }else{
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "NOT_LOGGED_IN", "redirect", "/login/index.html?redirect=/storymap/compusmap.html"));
        }
    }

    @PostMapping("/storymaps/{storyMapId}/like")
    @Operation(summary = "点赞地图")
    public ResponseEntity<?> likeStoryMap(@PathVariable UUID storyMapId) {
        service.incrementLikes(storyMapId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private StoryMapDTO convertToDTO(StoryMapCombined storyMap) {
        User author = userService.findById(storyMap.getAuthorId());
        String authorName = author != null ? author.getUsername() : "Unknown";

        // 为了保持响应格式不变，将单个位置信息包装进 List
        List<StoryMapDTO.LocationDTO> locations = List.of(
                StoryMapDTO.LocationDTO.builder()
                        .locationId(storyMap.getLocationId())
                        .lat(storyMap.getLat())
                        .lng(storyMap.getLng())
                        .title(storyMap.getLocationTitle())
                        .description(storyMap.getLocationDescription())
                        .imageUrl(storyMap.getLocationImageUrl())
                        .build()
        );

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
                .likes(storyMap.getLikesCount())
                .comments(String.valueOf(storyMap.getCommentCount()))
                .lat(storyMap.getLat())
                .lng(storyMap.getLng())
                .build();
    }
}
