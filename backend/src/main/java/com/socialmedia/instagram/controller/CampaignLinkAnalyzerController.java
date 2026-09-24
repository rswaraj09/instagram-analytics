package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.dto.CampaignLinkAnalysisDTO;
import com.socialmedia.instagram.service.CampaignLinkAnalyzerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/campaign-analyzer")
@RequiredArgsConstructor
@Slf4j
public class CampaignLinkAnalyzerController {

    private final CampaignLinkAnalyzerService analyzerService;

    @PostMapping("/analyze")
    public ResponseEntity<CampaignLinkAnalysisDTO> analyzeCampaignUrl(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, String> request) {
        String url = request.get("url");
        CampaignLinkAnalysisDTO dto = analyzerService.analyzeCampaignUrl(url, userId);
        if (!Boolean.TRUE.equals(dto.getIsValid())) {
            return ResponseEntity.badRequest().body(dto);
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<CampaignLinkAnalysisDTO>> getRecentAnalyses(
            @AuthenticationPrincipal UUID userId) {
        List<CampaignLinkAnalysisDTO> list = analyzerService.getUserAnalyses(userId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAnalysisById(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        try {
            CampaignLinkAnalysisDTO dto = analyzerService.getAnalysisById(id, userId);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnalysis(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        try {
            analyzerService.deleteAnalysis(id, userId);
            return ResponseEntity.ok(Map.of("message", "Campaign link analysis record deleted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
