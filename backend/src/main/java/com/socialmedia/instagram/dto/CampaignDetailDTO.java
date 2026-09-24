package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignDetailDTO {
    private CampaignDTO campaign;
    private List<CampaignContentDTO> contents;
    private List<CampaignInfluencerDTO> influencers;
    private List<CampaignGoalDTO> goals;
    private List<CampaignMetricDTO> metrics;
    private CampaignAudienceDTO audience;
    private CampaignAIInsightsDTO aiInsights;

    // Per-Account Campaign Breakdown
    private List<AccountCampaignMetrics> accountBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountCampaignMetrics {
        private String username;
        private String displayName;
        private Long reach;
        private Long impressions;
        private Long engagements;
        private Double engagementRate;
        private Double spend;
        private Double roas;
    }
}
