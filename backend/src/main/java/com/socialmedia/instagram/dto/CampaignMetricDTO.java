package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignMetricDTO {
    private LocalDate date;
    private Long reach;
    private Long impressions;
    private Integer likes;
    private Integer comments;
    private Integer shares;
    private Integer saves;
    private Long videoViews;
    private Integer profileVisits;
    private Integer followerGrowth;
    private Integer linkClicks;
    private Integer conversions;
    private Double spend;
    private Double revenue;
    private Double engagementRate;
}
