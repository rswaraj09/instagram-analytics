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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/analytics/hashtags")
@RequiredArgsConstructor
@Slf4j
public class HashtagAnalyticsController {

    private final InstagramAccountService accountService;
    private final ContentSyncService contentSyncService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getHashtagAnalytics(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) UUID accountId
    ) {
        var credsOpt = accountService.resolveCredentials(userId, accountId);
        if (credsOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No Instagram account connected."));
        }

        try {
            var creds = credsOpt.get();
            List<MediaItem> media = contentSyncService.syncAllMedia(creds.igUserId(), creds.accessToken(), 200);

            Map<String, HashtagStat> statsMap = new HashMap<>();
            Pattern pattern = Pattern.compile("#\\w+");

            for (MediaItem m : media) {
                if (m.getCaption() == null) continue;
                Matcher matcher = pattern.matcher(m.getCaption());
                Set<String> tagsInPost = new HashSet<>();
                while (matcher.find()) {
                    tagsInPost.add(matcher.group().toLowerCase());
                }

                for (String tag : tagsInPost) {
                    HashtagStat stat = statsMap.computeIfAbsent(tag, k -> new HashtagStat(tag));
                    stat.count++;
                    stat.totalLikes += (m.getLikeCount() != null ? m.getLikeCount() : 0);
                    stat.totalComments += (m.getCommentsCount() != null ? m.getCommentsCount() : 0);
                    stat.totalReach += (m.getReach() != null ? m.getReach() : 0);
                    if (m.getEngagementRate() != null) {
                        stat.engagementSum += m.getEngagementRate();
                    }
                }
            }

            List<HashtagStat> allStats = new ArrayList<>(statsMap.values());
            allStats.forEach(HashtagStat::calculateAverages);
            allStats.sort(Comparator.comparingInt((HashtagStat s) -> s.count).reversed());

            List<HashtagStat> frequentlyUsed = allStats.stream().limit(10).toList();

            List<HashtagStat> highPerforming = new ArrayList<>(allStats);
            highPerforming.sort(Comparator.comparingDouble((HashtagStat s) -> s.avgEngagementRate).reversed());
            highPerforming = highPerforming.stream().limit(8).toList();

            List<HashtagStat> lowPerforming = new ArrayList<>(allStats);
            lowPerforming.sort(Comparator.comparingDouble((HashtagStat s) -> s.avgEngagementRate));
            lowPerforming = lowPerforming.stream().filter(s -> s.count > 1).limit(5).toList();

            List<Map<String, String>> recommended = List.of(
                Map.of("tag", "#instagramgrowth2026", "reason", "High relevance to your core media category"),
                Map.of("tag", "#reelsviral", "reason", "Strong engagement booster for video content"),
                Map.of("tag", "#contentcreatortips", "reason", "High audience retention rate"),
                Map.of("tag", "#socialmediastrategy", "reason", "Targeted niche reach")
            );

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("totalUniqueHashtags", allStats.size());
            response.put("frequentlyUsed", frequentlyUsed);
            response.put("highPerforming", highPerforming);
            response.put("lowPerforming", lowPerforming);
            response.put("recommendedHashtags", recommended);
            response.put("savedGroups", List.of(
                Map.of("groupName", "Tech & AI", "hashtags", List.of("#tech", "#ai", "#software", "#coding")),
                Map.of("groupName", "Growth & Viral", "hashtags", List.of("#growth", "#reels2026", "#viral", "#explore"))
            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Hashtag analytics error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @lombok.Getter
    private static class HashtagStat {
        public String hashtag;
        public int count = 0;
        public long totalLikes = 0;
        public long totalComments = 0;
        public long totalReach = 0;
        public double engagementSum = 0.0;
        public double avgEngagementRate = 0.0;

        public HashtagStat(String tag) {
            this.hashtag = tag;
        }

        public void calculateAverages() {
            if (count > 0) {
                this.avgEngagementRate = Math.round((engagementSum / count) * 100.0) / 100.0;
            }
        }
    }
}
