package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Dashboard summary computed across all synced media items.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummary {

    private long totalPosts;
    private long totalReels;
    private long totalVideos;
    private long totalImages;

    private long totalViews;
    private long totalLikes;
    private long totalComments;
    private long totalShares;
    private long totalSaves;
    private long totalReach;
    private long totalImpressions;
    private double averageEngagementRate;

    private MediaItem bestPerformingReel;
    private MediaItem bestPerformingPost;
    private MediaItem fastestGrowingContent;
    private MediaItem mostSharedContent;
    private MediaItem mostSavedContent;

    private List<DailySnapshot> dailySnapshots;
    private String lastSyncedAt;
}
