package com.socialmedia.instagram.dto;

import java.util.List;

/**
 * Aggregated analytics across all connected Instagram accounts for a user.
 * Explicitly separates totals and averages across accounts.
 */
public record CombinedAnalyticsResponse(
    long totalAccounts,
    long totalFollowers,
    long totalFollowing,
    long totalReach,
    long totalImpressions,
    long totalEngagement,
    double averageEngagementRate,
    int totalPosts,
    int totalReels,
    int activeCampaignsCount,
    List<InstagramAccountResponse> accountBreakdown
) {}
