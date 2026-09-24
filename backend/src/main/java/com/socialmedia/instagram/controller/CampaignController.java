package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.dto.*;
import com.socialmedia.instagram.entity.*;
import com.socialmedia.instagram.service.CampaignService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
@Slf4j
public class CampaignController {

    private final CampaignService campaignService;

    @GetMapping
    public ResponseEntity<List<CampaignDTO>> getCampaigns(@AuthenticationPrincipal UUID userId) {
        List<CampaignDTO> campaigns = campaignService.getUserCampaigns(userId);
        return ResponseEntity.ok(campaigns);
    }

    @PostMapping
    public ResponseEntity<?> createCampaign(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Campaign campaign) {
        try {
            CampaignDTO created = campaignService.createCampaign(userId, campaign);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCampaignDetail(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        try {
            CampaignDetailDTO detail = campaignService.getCampaignDetail(id, userId);
            return ResponseEntity.ok(detail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCampaign(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody Campaign campaign) {
        try {
            CampaignDTO updated = campaignService.updateCampaign(id, userId, campaign);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCampaign(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        try {
            campaignService.deleteCampaign(id, userId);
            return ResponseEntity.ok(Map.of("message", "Campaign deleted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/content")
    public ResponseEntity<?> addCampaignContent(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody CampaignContent content) {
        try {
            CampaignContentDTO saved = campaignService.addContent(id, userId, content);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/content/{contentId}")
    public ResponseEntity<?> deleteCampaignContent(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PathVariable UUID contentId) {
        try {
            campaignService.deleteContent(id, contentId, userId);
            return ResponseEntity.ok(Map.of("message", "Campaign content removed successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/influencers")
    public ResponseEntity<?> addCampaignInfluencer(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody CampaignInfluencer influencer) {
        try {
            CampaignInfluencerDTO saved = campaignService.addInfluencer(id, userId, influencer);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/influencers/{influencerId}")
    public ResponseEntity<?> deleteCampaignInfluencer(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PathVariable UUID influencerId) {
        try {
            campaignService.deleteInfluencer(id, influencerId, userId);
            return ResponseEntity.ok(Map.of("message", "Influencer removed successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/goals")
    public ResponseEntity<?> addCampaignGoal(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody CampaignGoal goal) {
        try {
            CampaignGoalDTO saved = campaignService.addGoal(id, userId, goal);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/goals/{goalId}")
    public ResponseEntity<?> deleteCampaignGoal(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PathVariable UUID goalId) {
        try {
            campaignService.deleteGoal(id, goalId, userId);
            return ResponseEntity.ok(Map.of("message", "Goal removed successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/metrics")
    public ResponseEntity<?> getCampaignMetrics(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "daily") String period) {
        List<CampaignMetricDTO> metrics = campaignService.getCampaignMetrics(id, startDate, endDate, period);
        return ResponseEntity.ok(metrics);
    }

    @PostMapping("/{id}/metrics/daily")
    public ResponseEntity<?> addDailyMetric(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody CampaignMetric metric) {
        try {
            CampaignMetricDTO saved = campaignService.addOrUpdateDailyMetric(id, userId, metric);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/insights")
    public ResponseEntity<?> getCampaignInsights(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        try {
            CampaignDetailDTO detail = campaignService.getCampaignDetail(id, userId);
            return ResponseEntity.ok(detail.getAiInsights());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/compare")
    public ResponseEntity<?> compareCampaigns(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, List<UUID>> request) {
        List<UUID> ids = request.get("campaignIds");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "At least one campaign ID is required for comparison."));
        }
        CampaignComparisonDTO comparison = campaignService.compareCampaigns(userId, ids);
        return ResponseEntity.ok(comparison);
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<?> getCampaignReport(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        try {
            CampaignDetailDTO detail = campaignService.getCampaignDetail(id, userId);
            return ResponseEntity.ok(detail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
