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
public class CampaignAIInsightsDTO {
    private List<String> whatPerformedWell;
    private List<String> whatPerformedPoorly;
    private String bestPerformingContent;
    private String bestPerformingInfluencer;
    private String audienceInsights;
    private String engagementTrends;
    private List<String> campaignWeaknesses;
    private List<String> recommendedImprovements;
    private String suggestedStrategy;
    private Double overallScore;
}
