package org.neonangellock.azurecanvas.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.neonangellock.azurecanvas.model.TreeholeComment;
import org.neonangellock.azurecanvas.model.TreeholePost;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.model.es.EsTreeHole;
import org.neonangellock.azurecanvas.responses.TreeholeResponse;
import org.neonangellock.azurecanvas.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@Slf4j
@RequestMapping("/api/treeholes")
public class TreeholeController {

    @Autowired
    private TreeholeService treeholeService;

    @Autowired
    private IMarketService marketService;

    @Autowired
    private IStoryMapService storyMapService;

    @Autowired
    private EsTreeHoleService esTreeHoleService;

    @Autowired
    private UserService userService;

    @Autowired
    private ImageService imageService;


    @GetMapping("/posts")
    public ResponseEntity<List<Map<String, Object>>> getAllPosts() {
        List<TreeholePost> posts = treeholeService.findAllPosts();
        return ResponseEntity.ok(postsToMapList(posts));
    }

    @GetMapping("/posts/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentPosts(@RequestParam(defaultValue = "20") int limit) {
        List<TreeholePost> posts = treeholeService.findRecentPosts(limit);
        return ResponseEntity.ok(postsToMapList(posts));
    }

    private List<Map<String, Object>> postsToMapList(List<TreeholePost> posts) {
        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (TreeholePost post : posts) {
            Map<String, Object> m = mapper.convertValue(post, Map.class);
            m.put("imagesList", imageService.findByTreeholePost(post));
            if (post.getUserId() != null) {
                User u = userService.findById(post.getUserId());
                if (u != null) {
                    m.put("author", u.getUsername());
                    m.put("avatarUrl", u.getAvatarUrl());
                    m.put("avatarLetter", u.getUsername().substring(0, 1));
                }
            } else {
                m.put("author", "匿名用户");
                m.put("avatarLetter", "匿");
            }
            result.add(m);
        }
        return result;
    }

    @GetMapping("/newest")
    public ResponseEntity<?> getNewestPosts(){

        try {
            return ResponseEntity.ok(
                    Map.of(
                            "items", this.marketService.findNewest(),
                            "treehole", this.treeholeService.getNewest(),
                            "storymap", this.storyMapService.findNewest()
                    )
            );
        } catch (Exception e) {
            log.error("error loading the newest posts {}", e.getMessage());
        }
        return ResponseEntity.internalServerError().build();
    }
    @GetMapping("/posts/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Integer id) {
        TreeholePost post = treeholeService.findPostById(id);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> result = mapper.convertValue(post, Map.class);

        result.put("imagesList", imageService.findByTreeholePost(post));

        if (post.getUserId() != null) {
            User u = userService.findById(post.getUserId());
            if (u != null) {
                result.put("author", u.getUsername());
                result.put("avatarUrl", u.getAvatarUrl());
            }
        } else {
            result.put("author", "null");
        }

        List<TreeholeComment> allComments = treeholeService.findCommentsByPostId(id);
        List<Map<String, Object>> nested = buildCommentTreeWithUser(allComments);
        result.put("comments", nested);

        return ResponseEntity.ok(result);
    }

    private List<Map<String, Object>> buildCommentTreeWithUser(List<TreeholeComment> comments) {
        ObjectMapper mapper = new ObjectMapper();
        Map<Integer, Map<String, Object>> map = new java.util.LinkedHashMap<>();
        List<Map<String, Object>> roots = new java.util.ArrayList<>();

        for (TreeholeComment c : comments) {
            Map<String, Object> node = mapper.convertValue(c, Map.class);
            if (c.getUserId() != null) {
                User u = userService.findById(c.getUserId());
                if (u != null) {
                    node.put("authorName", u.getUsername());
                    node.put("avatarUrl", u.getAvatarUrl());
                    node.put("avatarLetter", u.getUsername().substring(0, 1));
                } else {
                    node.put("authorName", "null");
                }
            } else {
                node.put("authorName", "null");
            }
            node.put("children", new java.util.ArrayList<>());
            map.put(c.getId(), node);
        }

        for (TreeholeComment c : comments) {
            Map<String, Object> node = map.get(c.getId());
            if (c.getParentId() != null && map.containsKey(c.getParentId())) {
                ((List) map.get(c.getParentId()).get("children")).add(node);
            } else {
                roots.add(node);
            }
        }
        return roots;
    }

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> request,
                                                   @CookieValue(name = "user_id", required = false) UUID userId) throws JsonProcessingException {
        User u = userService.findById(userId);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "NOT_LOGGED_IN", "redirect", "/login/index.html?redirect=/treehole/index.html"));
        }
        TreeholePost post = new TreeholePost();
        post.setContent((String) request.get("content"));
        Object title = request.get("title");
        if (title != null) {
            post.setTitle((String) title);
        }
        Object category = request.get("category");
        if (category != null) {
            post.setCategory((String) category);
        }
        
        post.setUserId(userId);
        
        return ResponseEntity.ok(treeholeService.savePost(post));
    }

    @PostMapping("/posts/{id}/images")
    public ResponseEntity<?> associateImages(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        Object images = request.get("images");
        if (images instanceof List) {
            List<String> imageUrls = (List<String>) images;
            treeholeService.addImages(imageUrls, id);
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Integer id) {
        treeholeService.deletePostById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<Void> likePost(@PathVariable Integer id) {
        treeholeService.incrementLikeCount(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/posts/{id}/unlike")
    public ResponseEntity<Void> unlikePost(@PathVariable Integer id) {
        treeholeService.decrementLikeCount(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<TreeholeComment>> getCommentsByPostId(@PathVariable Integer postId) {
        return ResponseEntity.ok(treeholeService.findCommentsByPostId(postId));
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable Integer postId,
            @RequestBody Map<String, Object> request,
            @CookieValue(name = "user_id", required = false) UUID userId) {
        User u = userService.findById(userId);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "NOT_LOGGED_IN"));
        }
        TreeholePost post = treeholeService.findPostById(postId);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }
        TreeholeComment comment = new TreeholeComment();
        comment.setContent((String) request.get("content"));
        Object parentId = request.get("parentId");
        if (parentId != null) {
            comment.setParentId((Integer) parentId);
        }
        
        comment.setUserId(userId);
        comment.setPost(post);
        return ResponseEntity.ok(treeholeService.saveComment(comment));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Integer id) {
        treeholeService.deleteCommentById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/search", produces = "application/json; charset=utf-8")
    public ResponseEntity<List<TreeholeResponse>> searchTreeholes(
            @RequestParam String keyword,
            @RequestParam(required = false, defaultValue = "all") String category) {

        // 调用ES服务进行搜索
        SearchHits<EsTreeHole> searchHits = esTreeHoleService.searchTreeHole(keyword, 0, 100);

        // 转换为前端需要的格式
        List<TreeholeResponse> responseList = new ArrayList<>();

        // 检查searchHits是否为null，以及是否有搜索结果
        if (searchHits != null && searchHits.hasSearchHits()) {
            responseList = searchHits.getSearchHits().stream()
                    .map(searchHit -> {
                        EsTreeHole treeHole = searchHit.getContent();
                        TreeholeResponse response = new TreeholeResponse();
                        response.setId(treeHole.getId());
                        response.setAuthor(treeHole.getBoardName() != null && !treeHole.getBoardName().isEmpty()
                                ? treeHole.getBoardName()
                                : "匿名用户");
                        response.setAuthorId(treeHole.getId());
                        response.setAvatarLetter(treeHole.getBoardName() != null && !treeHole.getBoardName().isEmpty()
                                ? treeHole.getBoardName().substring(0, 1)
                                : "匿");
                        response.setTimestamp(System.currentTimeMillis());

                        // 处理高亮信息
                        String content = treeHole.getContent() != null ? treeHole.getContent()
                                : (treeHole.getTitle() != null ? treeHole.getTitle() : "");

                        // 检查是否有高亮信息
                        if (searchHit.getHighlightFields() != null && !searchHit.getHighlightFields().isEmpty()) {
                            // 优先使用高亮的内容
                            if (searchHit.getHighlightFields().containsKey("content")) {
                                List<String> highlightContent = searchHit.getHighlightFields().get("content");
                                if (highlightContent != null && !highlightContent.isEmpty()) {
                                    content = String.join(" ", highlightContent);
                                }
                            } else if (searchHit.getHighlightFields().containsKey("title")) {
                                List<String> highlightTitle = searchHit.getHighlightFields().get("title");
                                if (highlightTitle != null && !highlightTitle.isEmpty()) {
                                    content = String.join(" ", highlightTitle);
                                }
                            }
                        }

                        response.setContent(content);
                        response.setCategory(category);
                        
                        // 从数据库查询图片
                        TreeholePost tempPost = new TreeholePost();
                        tempPost.setId(Integer.parseInt(treeHole.getId()));
                        response.setImages(imageService.findByTreeholePost(tempPost));
                        
                        response.setLikes(0);
                        response.setLiked(false);
                        response.setCollected(false);
                        response.setComments(List.of());
                        return response;
                    })
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/sync/status")
    public ResponseEntity<Map<String, Object>> getSyncStatus() {
        return ResponseEntity.ok(esTreeHoleService.getSyncStatus());
    }
}
