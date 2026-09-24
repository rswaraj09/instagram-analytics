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
public class CampaignGoalDTO {
    private UUID id;
    private UUID campaignId;
    private String metricType;
    private Double targetValue;
    private Double currentValue;
    private Double progressPercentage;
    private Boolean isOnTrack;
    private Instant createdAt;
}
