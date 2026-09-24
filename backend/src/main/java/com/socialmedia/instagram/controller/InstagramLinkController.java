package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.dto.InstagramLinkDTO;
import com.socialmedia.instagram.service.InstagramLinkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/instagram-links")
@RequiredArgsConstructor
@Slf4j
public class InstagramLinkController {

    private final InstagramLinkService linkService;

    @PostMapping("/validate")
    public ResponseEntity<InstagramLinkDTO> validateUrl(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, String> request) {
        String url = request.get("url");
        InstagramLinkDTO validated = linkService.validateUrl(url, userId);
        return ResponseEntity.ok(validated);
    }

    @PostMapping
    public ResponseEntity<?> saveLink(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, String> request) {
        try {
            String url = request.get("url");
            String campaignIdStr = request.get("campaignId");
            UUID campaignId = (campaignIdStr != null && !campaignIdStr.isBlank()) ? UUID.fromString(campaignIdStr) : null;
            InstagramLinkDTO saved = linkService.saveLink(userId, url, campaignId);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<InstagramLinkDTO>> getUserLinks(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(required = false) UUID campaignId) {
        List<InstagramLinkDTO> links = linkService.getUserLinks(userId, campaignId);
        return ResponseEntity.ok(links);
    }

    @PutMapping("/{id}/assign-campaign")
    public ResponseEntity<?> assignCampaign(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        try {
            String campaignIdStr = request.get("campaignId");
            UUID campaignId = (campaignIdStr != null && !campaignIdStr.isBlank()) ? UUID.fromString(campaignIdStr) : null;
            InstagramLinkDTO updated = linkService.assignCampaign(id, userId, campaignId);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLink(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        try {
            linkService.deleteLink(id, userId);
            return ResponseEntity.ok(Map.of("message", "Instagram link deleted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

