package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "campaign_influencers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignInfluencer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "influencer_name", nullable = false)
    private String influencerName;

    private String handle;

    @Builder.Default
    private Integer followers = 0;

    @Builder.Default
    private Long reach = 0L;

    @Builder.Default
    private Integer engagements = 0;

    @Column(name = "content_count")
    @Builder.Default
    private Integer contentCount = 1;

    @Builder.Default
    private Double cost = 0.0;

    @Builder.Default
    private Integer conversions = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (followers == null) followers = 0;
        if (reach == null) reach = 0L;
        if (engagements == null) engagements = 0;
        if (contentCount == null) contentCount = 1;
        if (cost == null) cost = 0.0;
        if (conversions == null) conversions = 0;
    }
}
