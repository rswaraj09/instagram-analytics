package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignInfluencerDTO {
    private UUID id;
    private UUID campaignId;
    private String influencerName;
    private String handle;
    private Integer followers;
    private Long reach;
    private Integer engagements;
    private Integer contentCount;
    private Double cost;
    private Integer conversions;
    private String notes;
    private Double engagementRate;
    private Double cpe;
    private Double roi;
    private Integer rank;
    private Instant createdAt;
}
