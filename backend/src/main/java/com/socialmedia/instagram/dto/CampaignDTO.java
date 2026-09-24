package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignDTO {
    private UUID id;
    private UUID userId;
    private String name;
    private String objective;
    private String brand;
    private String category;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double budget;
    private Double totalSpend;
    private Double revenue;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    // Multi-Account references & Identity
    private List<UUID> accountIds;
    private List<String> accountHandles;
    private InstagramAccountSummaryDTO instagramAccount;
    private List<InstagramAccountSummaryDTO> instagramAccounts;

    // Aggregated Overview Metrics
    private Long totalReach;
    private Long totalImpressions;
    private Long totalEngagements;
    private Double engagementRate;
    private Long totalLikes;
    private Long totalComments;
    private Long totalShares;
    private Long totalSaves;
    private Long totalVideoViews;
    private Long totalProfileVisits;
    private Integer totalFollowerGrowth;
    private Long totalLinkClicks;
    private Integer totalConversions;
    private Double conversionRate;
    private Double ctr;
    private Double cpe;
    private Double cpc;
    private Double cpm;
    private Double roas;
    private Integer contentCount;
    private Integer influencerCount;
    private List<CampaignContentDTO> contents;
}
