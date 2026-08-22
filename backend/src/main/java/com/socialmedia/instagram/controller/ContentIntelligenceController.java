package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.dto.MediaItem;
import com.socialmedia.instagram.service.ContentSyncService;
import com.socialmedia.instagram.service.InstagramAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/analytics/content-intelligence")
@RequiredArgsConstructor
@Slf4j
public class ContentIntelligenceController {

    private final InstagramAccountService accountService;
    private final ContentSyncService contentSyncService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getContentIntelligence(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) UUID accountId,
        @RequestParam(defaultValue = "0.2") double likeWeight,
        @RequestParam(defaultValue = "0.3") double commentWeight,
        @RequestParam(defaultValue = "0.3") double shareWeight,
        @RequestParam(defaultValue = "0.2") double saveWeight
    ) {
        var credsOpt = accountService.resolveCredentials(userId, accountId);
        if (credsOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No Instagram account connected."));
        }

        try {
            var creds = credsOpt.get();
            List<MediaItem> items = contentSyncService.syncAllMedia(creds.igUserId(), creds.accessToken(), 200);

            if (items.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "No content available to analyze."));
            }

            // Calculate weighted Content Score for each media item
            List<Map<String, Object>> scoredItems = new ArrayList<>();
            for (MediaItem item : items) {
                long likes = item.getLikeCount() != null ? item.getLikeCount() : 0;
                long comments = item.getCommentsCount() != null ? item.getCommentsCount() : 0;
                long shares = item.getShares() != null ? item.getShares() : 0;
                long saves = item.getSaved() != null ? item.getSaved() : 0;

                double rawScore = (likes * likeWeight) + (comments * commentWeight) + (shares * shareWeight) + (saves * saveWeight);
                double normalizedScore = Math.min(100.0, Math.round(rawScore / 10.0 * 10.0) / 10.0);

                Map<String, Object> map = new LinkedHashMap<>();
                map.put("media", item);
                map.put("contentScore", normalizedScore);
                scoredItems.add(map);
            }

            scoredItems.sort((a, b) -> Double.compare((double) b.get("contentScore"), (double) a.get("contentScore")));

            MediaItem bestPost = items.stream()
                .filter(m -> !"REELS".equalsIgnoreCase(m.getMediaProductType()))
                .max(Comparator.comparingDouble(m -> m.getEngagementRate() != null ? m.getEngagementRate() : 0.0))
                .orElse(null);

            MediaItem bestReel = items.stream()
                .filter(m -> "REELS".equalsIgnoreCase(m.getMediaProductType()) || "VIDEO".equalsIgnoreCase(m.getMediaType()))
                .max(Comparator.comparingLong(m -> m.getVideoViews() != null ? m.getVideoViews() : 0))
                .orElse(null);

            MediaItem mostLiked = items.stream().max(Comparator.comparingLong(m -> m.getLikeCount() != null ? m.getLikeCount() : 0)).orElse(null);
            MediaItem mostCommented = items.stream().max(Comparator.comparingLong(m -> m.getCommentsCount() != null ? m.getCommentsCount() : 0)).orElse(null);
            MediaItem mostShared = items.stream().max(Comparator.comparingLong(m -> m.getShares() != null ? m.getShares() : 0)).orElse(null);
            MediaItem mostSaved = items.stream().max(Comparator.comparingLong(m -> m.getSaved() != null ? m.getSaved() : 0)).orElse(null);

            MediaItem lowestPerforming = scoredItems.get(scoredItems.size() - 1).get("media") instanceof MediaItem m ? m : null;

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("weights", Map.of(
                "likeWeight", likeWeight,
                "commentWeight", commentWeight,
                "shareWeight", shareWeight,
                "saveWeight", saveWeight
            ));

            response.put("bestPost", bestPost);
            response.put("bestReel", bestReel);
            response.put("mostLiked", mostLiked);
            response.put("mostCommented", mostCommented);
            response.put("mostShared", mostShared);
            response.put("mostSaved", mostSaved);
            response.put("lowestPerforming", lowestPerforming);
            response.put("rankedContent", scoredItems);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed content intelligence: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
