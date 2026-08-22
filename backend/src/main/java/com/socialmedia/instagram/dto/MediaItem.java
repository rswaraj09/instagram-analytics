package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO representing a single media item (post or reel) fetched from the
 * Instagram Graph API with all available analytics fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaItem {

    private String id;
    private String shortcode;
    private String mediaType;        // IMAGE, VIDEO, CAROUSEL_ALBUM
    private String mediaProductType; // FEED, REELS, STORY, AD
    private String caption;
    private String mediaUrl;
    private String thumbnailUrl;
    private String permalink;
    private Instant timestamp;

    // Duration in seconds (for videos/reels)
    private Long duration;

    // Basic engagement
    private Long likeCount;
    private Long commentsCount;

    // Graph API insights (requires business account)
    private Long reach;
    private Long impressions;
    private Long saved;
    private Long videoViews;
    private Long shares;
    private Long profileVisits;
    private Long follows;
    private Long clicks;
    private Long plays;
    private Long totalInteractions;

    // Watch metrics (reels)
    private Long videoViewTotalTime; // in milliseconds
    private Long avgWatchTime;       // in milliseconds

    // Computed
    private Double engagementRate;
}
