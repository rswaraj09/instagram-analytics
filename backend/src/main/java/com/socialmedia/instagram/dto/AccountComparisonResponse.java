package com.socialmedia.instagram.dto;

import java.util.List;
import java.util.UUID;

/**
 * Side-by-side comparison response for multiple Instagram accounts.
 */
public record AccountComparisonResponse(
    List<AccountBenchmark> accounts,
    AccountBenchmark topByReach,
    AccountBenchmark topByEngagementRate,
    AccountBenchmark topByFollowers,
    String summaryTakeaway
) {
    public record AccountBenchmark(
        UUID id,
        String username,
        String displayName,
        String profilePicture,
        long followers,
        long reach,
        long impressions,
        long engagement,
        double engagementRate,
        int posts,
        int reels,
        long followerGrowth,
        int activeCampaigns
    ) {}
}
