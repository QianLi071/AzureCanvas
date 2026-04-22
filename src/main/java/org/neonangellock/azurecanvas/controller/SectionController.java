package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.Section;
import org.neonangellock.azurecanvas.service.SectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sections")
public class SectionController {

    @Autowired
    private SectionService sectionService;

    @GetMapping
    public ResponseEntity<List<Section>> getAllSections() {
        return ResponseEntity.ok(sectionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSectionById(@PathVariable UUID id) {
        Section section = sectionService.findById(id);
        if (section == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("data",section));
    }

    @PostMapping
    public ResponseEntity<Section> createSection(@RequestBody Section section) {
        return ResponseEntity.ok(sectionService.save(section));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Section> updateSection(@PathVariable UUID id, @RequestBody Section section) {
        Section existingSection = sectionService.findById(id);
        if (existingSection == null) {
            return ResponseEntity.notFound().build();
        }
        section.setId(id);
        return ResponseEntity.ok(sectionService.save(section));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSection(@PathVariable UUID id) {
        sectionService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
