package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "campaign_audiences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignAudience {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "campaign_id", nullable = false, unique = true)
    private UUID campaignId;

    @Column(name = "age_groups", columnDefinition = "TEXT")
    private String ageGroups;

    @Column(name = "gender_distribution", columnDefinition = "TEXT")
    private String genderDistribution;

    @Column(name = "top_countries", columnDefinition = "TEXT")
    private String topCountries;

    @Column(name = "top_cities", columnDefinition = "TEXT")
    private String topCities;

    @Column(columnDefinition = "TEXT")
    private String interests;

    @Column(name = "follower_reach")
    @Builder.Default
    private Long followerReach = 0L;

    @Column(name = "non_follower_reach")
    @Builder.Default
    private Long nonFollowerReach = 0L;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (followerReach == null) followerReach = 0L;
        if (nonFollowerReach == null) nonFollowerReach = 0L;
    }
}
