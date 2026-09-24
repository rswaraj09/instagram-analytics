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
public class CampaignContentDTO {
    private UUID id;
    private UUID campaignId;
    private String mediaId;
    private String mediaType; // POST, REEL, STORY
    private String caption;
    private String permalink;
    private String thumbnailUrl;
    private Instant publishedAt;
    private Long reach;
    private Long impressions;
    private Integer likes;
    private Integer comments;
    private Integer shares;
    private Integer saves;
    private Long views;
    private Integer linkClicks;
    private Integer conversions;
    private Double engagementRate;
    private Double ctr;
    private Instant createdAt;
}
