package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "campaign_link_analyses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignLinkAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = true)
    private UUID userId;

    @Column(name = "url", nullable = false, length = 1000)
    private String url;

    @Column(name = "campaign_name", length = 255)
    private String campaignName;

    @Column(name = "campaign_id", length = 255)
    private String campaignIdStr;

    @Column(name = "status", length = 50)
    private String status; // ACTIVE, PAUSED, COMPLETED, EXPIRED, ARCHIVED, UNSUPPORTED

    @Column(name = "objective", length = 255)
    private String objective;

    @Column(name = "content_type", length = 50)
    private String contentType; // AD, REEL_AD, POST_BOOST, CAMPAIGN_LINK, PROFILE, UNKNOWN

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "budget")
    private Double budget;

    @Column(name = "budget_type", length = 50)
    private String budgetType; // DAILY, LIFETIME

    @Column(name = "total_spend")
    private Double totalSpend;

    @Column(name = "reach")
    private Long reach;

    @Column(name = "impressions")
    private Long impressions;

    @Column(name = "clicks")
    private Long clicks;

    @Column(name = "ctr")
    private Double ctr;

    @Column(name = "likes")
    private Integer likes;

    @Column(name = "comments")
    private Integer comments;

    @Column(name = "shares")
    private Integer shares;

    @Column(name = "saves")
    private Integer saves;

    @Column(name = "video_views")
    private Long videoViews;

    @Column(name = "engagement_rate")
    private Double engagementRate;

    @Column(name = "conversions")
    private Integer conversions;

    @Column(name = "cost_per_result")
    private Double costPerResult;

    @Column(name = "cpc")
    private Double cpc;

    @Column(name = "cpm")
    private Double cpm;

    @Column(name = "roas")
    private Double roas;

    @Column(name = "cta_type", length = 100)
    private String ctaType;

    @Column(name = "author_handle", length = 255)
    private String authorHandle;

    @Column(name = "caption_snippet", length = 2000)
    private String captionSnippet;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Column(name = "is_authorized_connected_account", nullable = false)
    @Builder.Default
    private Boolean isAuthorizedConnectedAccount = false;

    @Column(name = "authorization_status", length = 100)
    private String authorizationStatus; // CONNECTED_ACCOUNT_FULL_INSIGHTS, PUBLIC_DATA_ONLY, PERMISSION_REQUIRED

    @Column(name = "audience_json", columnDefinition = "TEXT")
    private String audienceJson;

    @Column(name = "creative_details_json", columnDefinition = "TEXT")
    private String creativeDetailsJson;

    @Column(name = "daily_metrics_json", columnDefinition = "TEXT")
    private String dailyMetricsJson;

    @Column(name = "recommendations_json", columnDefinition = "TEXT")
    private String recommendationsJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (isAuthorizedConnectedAccount == null) isAuthorizedConnectedAccount = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
