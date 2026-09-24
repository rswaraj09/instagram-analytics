package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignLinkAnalysisDTO {

    private UUID id;
    private UUID userId;
    private String url;
    private String campaignName;
    private String campaignIdStr;
    private String status; // ACTIVE, PAUSED, COMPLETED, EXPIRED, ARCHIVED
    private String objective;
    private String contentType; // AD, REEL_AD, POST_BOOST, CAMPAIGN_LINK, PROFILE, UNKNOWN
    private LocalDate startDate;
    private LocalDate endDate;
    private Double budget;
    private String budgetType; // DAILY, LIFETIME
    private Double totalSpend;
    private Long reach;
    private Long impressions;
    private Long clicks;
    private Double ctr;
    private Integer likes;
    private Integer comments;
    private Integer shares;
    private Integer saves;
    private Long videoViews;
    private Double engagementRate;
    private Integer conversions;
    private Double costPerResult;
    private Double cpc;
    private Double cpm;
    private Double roas;
    private String ctaType;
    private String authorHandle;
    private String authorDisplayName;
    private String authorProfilePicture;
    private InstagramAccountSummaryDTO instagramAccount;
    private String captionSnippet;
    private String thumbnailUrl;
    private Boolean isAuthorizedConnectedAccount;
    private String authorizationStatus; // CONNECTED_ACCOUNT_FULL_INSIGHTS, PUBLIC_DATA_ONLY, PERMISSION_REQUIRED
    private Instant createdAt;
    private Instant updatedAt;

    // Status & Error indicators
    private Boolean isValid;
    private String validationMessage;
    private String errorCode; // INVALID_URL, UNSUPPORTED_LINK, EXPIRED_LINK, PERMISSION_REQUIRED, API_UNAVAILABLE

    // Structured JSON / Objects
    private Map<String, Object> audienceData;
    private Map<String, Object> creativeDetails;
    private List<Map<String, Object>> dailyMetrics;
    private List<String> recommendations;
}
