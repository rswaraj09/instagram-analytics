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
public class CampaignComparisonDTO {
    private List<CampaignDTO> campaigns;
    private String bestPerformingCampaignId;
    private String bestPerformingCampaignName;
    private String comparisonSummary;
}
