package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "campaign_contents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignContent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "media_id")
    private String mediaId;

    @Column(name = "media_type", nullable = false, length = 50)
    private String mediaType; // POST, REEL, STORY

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(length = 500)
    private String permalink;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "published_at")
    private Instant publishedAt;

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

    @Builder.Default
    private Long views = 0L;

    @Column(name = "link_clicks")
    @Builder.Default
    private Integer linkClicks = 0;

    @Builder.Default
    private Integer conversions = 0;

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
        if (views == null) views = 0L;
        if (linkClicks == null) linkClicks = 0;
        if (conversions == null) conversions = 0;
    }
}
