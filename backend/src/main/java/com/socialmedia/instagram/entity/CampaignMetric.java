package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "campaign_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Builder.Default
    private Long reach = 0L;

    @Builder.Default
    private Long impressions = 0L;

    @Builder.Default
    private Integer likes = 0;

    @Builder.Default
    private Integer comments = 0;

    @Builder.Default
    private Integer shares = 0;

    @Builder.Default
    private Integer saves = 0;

    @Column(name = "video_views")
    @Builder.Default
    private Long videoViews = 0L;

    @Column(name = "profile_visits")
    @Builder.Default
    private Integer profileVisits = 0;

    @Column(name = "follower_growth")
    @Builder.Default
    private Integer followerGrowth = 0;

    @Column(name = "link_clicks")
    @Builder.Default
    private Integer linkClicks = 0;

    @Builder.Default
    private Integer conversions = 0;

    @Builder.Default
    private Double spend = 0.0;

    @Builder.Default
    private Double revenue = 0.0;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (reach == null) reach = 0L;
        if (impressions == null) impressions = 0L;
        if (likes == null) likes = 0;
        if (comments == null) comments = 0;
        if (shares == null) shares = 0;
        if (saves == null) saves = 0;
        if (videoViews == null) videoViews = 0L;
        if (profileVisits == null) profileVisits = 0;
        if (followerGrowth == null) followerGrowth = 0;
        if (linkClicks == null) linkClicks = 0;
        if (conversions == null) conversions = 0;
        if (spend == null) spend = 0.0;
        if (revenue == null) revenue = 0.0;
    }
}
