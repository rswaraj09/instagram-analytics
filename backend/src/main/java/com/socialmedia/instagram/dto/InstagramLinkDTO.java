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
public class InstagramLinkDTO {
    private UUID id;
    private UUID userId;
    private UUID campaignId;
    private String campaignName;
    private String url;
    private String contentType; // POST, REEL, STORY, PROFILE, TV, UNKNOWN
    private String shortcodeOrHandle;
    private String authorHandle;
    private String captionSnippet;
    private String thumbnailUrl;
    private Integer likes;
    private Integer comments;
    private Long views;
    private Long reach;
    private Long impressions;
    private Integer shares;
    private Integer saves;
    private Boolean isAuthorizedConnectedAccount;
    private Instant createdAt;
    private Instant updatedAt;
    
    // Status indicators
    private Boolean isValid;
    private String validationMessage;
    private String authorizationStatus; // "CONNECTED_ACCOUNT_FULL_INSIGHTS" or "PUBLIC_DATA_ONLY"
}
