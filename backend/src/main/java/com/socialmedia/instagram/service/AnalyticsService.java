package com.socialmedia.instagram.service;

import com.socialmedia.instagram.dto.DailySnapshot;
import com.socialmedia.instagram.dto.DashboardSummary;
import com.socialmedia.instagram.dto.MediaItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes the analytics dashboard summary from a list of MediaItems.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    /**
     * Build a complete dashboard summary from the given media items.
     */
    public DashboardSummary buildSummary(List<MediaItem> items) {
        if (items == null || items.isEmpty()) {
            return DashboardSummary.builder()
                .dailySnapshots(Collections.emptyList())
                .lastSyncedAt(java.time.Instant.now().toString())
                .build();
        }

        long totalPosts    = items.size();
        long totalReels    = items.stream().filter(m -> "REELS".equalsIgnoreCase(m.getMediaProductType())).count();
        long totalVideos   = items.stream().filter(m -> "VIDEO".equalsIgnoreCase(m.getMediaType())).count();
        long totalImages   = items.stream().filter(m -> "IMAGE".equalsIgnoreCase(m.getMediaType())).count();

        long totalViews    = sum(items, MediaItem::getVideoViews);
        long totalLikes    = sum(items, MediaItem::getLikeCount);
        long totalComments = sum(items, MediaItem::getCommentsCount);
        long totalShares   = sum(items, MediaItem::getShares);
        long totalSaves    = sum(items, MediaItem::getSaved);
        long totalReach    = sum(items, MediaItem::getReach);
        long totalImpr     = sum(items, MediaItem::getImpressions);

        double avgEngagement = items.stream()
            .filter(m -> m.getEngagementRate() != null)
            .mapToDouble(MediaItem::getEngagementRate)
            .average().orElse(0.0);

        // Best performing reel (by plays/views)
        MediaItem bestReel = items.stream()
            .filter(m -> "REELS".equalsIgnoreCase(m.getMediaProductType()))
            .max(Comparator.comparingLong(m -> safe(m.getVideoViews()) + safe(m.getPlays())))
            .orElse(null);

        // Best performing post (by engagement)
        MediaItem bestPost = items.stream()
            .filter(m -> !"REELS".equalsIgnoreCase(m.getMediaProductType()))
            .max(Comparator.comparingDouble(m -> m.getEngagementRate() != null ? m.getEngagementRate() : 0.0))
            .orElse(null);

        // Fastest growing: highest reach relative to age (reach / days since posted)
        MediaItem fastestGrowing = items.stream()
            .filter(m -> m.getTimestamp() != null && m.getReach() != null && m.getReach() > 0)
            .max(Comparator.comparingDouble(m -> {
                long daysSince = Math.max(1,
                    (java.time.Instant.now().getEpochSecond() - m.getTimestamp().getEpochSecond()) / 86400);
                return (double) m.getReach() / daysSince;
            }))
            .orElse(null);

        MediaItem mostShared = items.stream()
            .max(Comparator.comparingLong(m -> safe(m.getShares())))
            .orElse(null);

        MediaItem mostSaved = items.stream()
            .max(Comparator.comparingLong(m -> safe(m.getSaved())))
            .orElse(null);

        List<DailySnapshot> daily = buildDailySnapshots(items);

        return DashboardSummary.builder()
            .totalPosts(totalPosts)
            .totalReels(totalReels)
            .totalVideos(totalVideos)
            .totalImages(totalImages)
            .totalViews(totalViews)
            .totalLikes(totalLikes)
            .totalComments(totalComments)
            .totalShares(totalShares)
            .totalSaves(totalSaves)
            .totalReach(totalReach)
            .totalImpressions(totalImpr)
            .averageEngagementRate(Math.round(avgEngagement * 100.0) / 100.0)
            .bestPerformingReel(bestReel)
            .bestPerformingPost(bestPost)
            .fastestGrowingContent(fastestGrowing)
            .mostSharedContent(mostShared)
            .mostSavedContent(mostSaved)
            .dailySnapshots(daily)
            .lastSyncedAt(java.time.Instant.now().toString())
            .build();
    }

    private List<DailySnapshot> buildDailySnapshots(List<MediaItem> items) {
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE.withZone(ZoneId.of("UTC"));

        Map<String, List<MediaItem>> byDate = items.stream()
            .filter(m -> m.getTimestamp() != null)
            .collect(Collectors.groupingBy(m -> fmt.format(m.getTimestamp())));

        return byDate.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(e -> {
                List<MediaItem> dayItems = e.getValue();
                double eng = dayItems.stream()
                    .filter(m -> m.getEngagementRate() != null)
                    .mapToDouble(MediaItem::getEngagementRate)
                    .average().orElse(0.0);
                return DailySnapshot.builder()
                    .date(e.getKey())
                    .views(sum(dayItems, MediaItem::getVideoViews))
                    .likes(sum(dayItems, MediaItem::getLikeCount))
                    .comments(sum(dayItems, MediaItem::getCommentsCount))
                    .shares(sum(dayItems, MediaItem::getShares))
                    .saves(sum(dayItems, MediaItem::getSaved))
                    .reach(sum(dayItems, MediaItem::getReach))
                    .impressions(sum(dayItems, MediaItem::getImpressions))
                    .engagementRate(Math.round(eng * 100.0) / 100.0)
                    .build();
            })
            .collect(Collectors.toList());
    }

    private long sum(List<MediaItem> items, java.util.function.Function<MediaItem, Long> getter) {
        return items.stream().mapToLong(m -> safe(getter.apply(m))).sum();
    }

    private long safe(Long v) { return v != null ? v : 0L; }
}
