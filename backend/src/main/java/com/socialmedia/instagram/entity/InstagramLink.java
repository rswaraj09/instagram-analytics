package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "instagram_links")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstagramLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = true)
    private UUID userId;

    @Column(name = "campaign_id")
    private UUID campaignId;

    @Column(name = "url", nullable = false, length = 1000)
    private String url;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType; // POST, REEL, STORY, PROFILE, TV, UNKNOWN

    @Column(name = "shortcode_or_handle", length = 255)
    private String shortcodeOrHandle;

    @Column(name = "author_handle", length = 255)
    private String authorHandle;

    @Column(name = "caption_snippet", length = 1000)
    private String captionSnippet;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    private Integer likes;
    private Integer comments;
    private Long views;
    private Long reach;
    private Long impressions;
    private Integer shares;
    private Integer saves;

    @Column(name = "is_authorized_connected_account", nullable = false)
    @Builder.Default
    private Boolean isAuthorizedConnectedAccount = false;

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
