package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.service.EsTreeHoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/treehole")
public class TreeHoleController {

    @Autowired
    private EsTreeHoleService esTreeHoleService;

    @GetMapping("/search/es")
    public List<Map<String, Object>> searchTreeHoleEs(
            @RequestParam("keyword") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        var searchHits = esTreeHoleService.searchTreeHole(keyword, page, size);
        List<Map<String, Object>> result = new ArrayList<>();

        for (var hit : searchHits.getSearchHits()) {
            var content = hit.getContent();
            Map<String, Object> item = Map.of(
                    "id", content.getId(),
                    "boardName", content.getBoardName(),
                    "title", content.getTitle(),
                    "content", content.getContent(),
                    "highlightTitle", hit.getHighlightFields().get("title"),
                    "highlightContent", hit.getHighlightFields().get("content")
            );
            result.add(item);
        }

        return result;
    }

    @PostMapping("/sync")
    public void syncTreeHole() {
        esTreeHoleService.syncTreeHoleFromApi();
    }
}
