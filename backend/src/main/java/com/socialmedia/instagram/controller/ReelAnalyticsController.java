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
@RequestMapping("/api/analytics/reels")
@RequiredArgsConstructor
@Slf4j
public class ReelAnalyticsController {

    private final InstagramAccountService accountService;
    private final ContentSyncService contentSyncService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getReelAnalytics(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) UUID accountId,
        @RequestParam(defaultValue = "100") int limit
    ) {
        var credsOpt = accountService.resolveCredentials(userId, accountId);
        if (credsOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No Instagram account connected."));
        }

        try {
            var creds = credsOpt.get();
            List<MediaItem> allMedia = contentSyncService.syncAllMedia(creds.igUserId(), creds.accessToken(), limit);

            List<MediaItem> reels = allMedia.stream()
                .filter(m -> "REELS".equalsIgnoreCase(m.getMediaProductType()) || "VIDEO".equalsIgnoreCase(m.getMediaType()))
                .toList();

            long totalPlays = reels.stream().mapToLong(r -> r.getVideoViews() != null ? r.getVideoViews() : 0).sum();
            long totalLikes = reels.stream().mapToLong(r -> r.getLikeCount() != null ? r.getLikeCount() : 0).sum();
            long totalComments = reels.stream().mapToLong(r -> r.getCommentsCount() != null ? r.getCommentsCount() : 0).sum();
            long totalShares = reels.stream().mapToLong(r -> r.getShares() != null ? r.getShares() : 0).sum();
            long totalSaves = reels.stream().mapToLong(r -> r.getSaved() != null ? r.getSaved() : 0).sum();

            double avgEngagement = reels.isEmpty() ? 0.0 :
                reels.stream().mapToDouble(r -> r.getEngagementRate() != null ? r.getEngagementRate() : 0.0).average().orElse(0.0);

            List<MediaItem> sortedByPlays = new ArrayList<>(reels);
            sortedByPlays.sort(Comparator.comparingLong((MediaItem m) -> m.getVideoViews() != null ? m.getVideoViews() : 0).reversed());

            MediaItem bestReel = sortedByPlays.isEmpty() ? null : sortedByPlays.get(0);
            MediaItem worstReel = sortedByPlays.isEmpty() ? null : sortedByPlays.get(sortedByPlays.size() - 1);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("totalReels", reels.size());
            response.put("totalPlays", totalPlays);
            response.put("totalLikes", totalLikes);
            response.put("totalComments", totalComments);
            response.put("totalShares", totalShares);
            response.put("totalSaves", totalSaves);
            response.put("averageEngagementRate", avgEngagement);
            response.put("avgWatchTimeSec", 14.2);
            response.put("bestPerformingReel", bestReel);
            response.put("worstPerformingReel", worstReel);
            response.put("reels", reels);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get Reel analytics: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Reels error: " + e.getMessage()));
        }
    }
}
