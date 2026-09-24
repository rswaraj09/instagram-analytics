package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "campaign_goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "metric_type", nullable = false, length = 100)
    private String metricType; // REACH, ENGAGEMENT, FOLLOWERS, WEBSITE_TRAFFIC, LEADS, SALES, CONVERSIONS

    @Column(name = "target_value", nullable = false)
    private Double targetValue;

    @Column(name = "current_value")
    @Builder.Default
    private Double currentValue = 0.0;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (currentValue == null) currentValue = 0.0;
    }
}
