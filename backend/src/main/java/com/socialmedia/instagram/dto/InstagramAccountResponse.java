package com.socialmedia.instagram.dto;

import com.socialmedia.instagram.entity.InstagramAccount.ConnectionStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Response view of an Instagram account. The appSecret and accessToken fields
 * are masked - raw secrets are never returned to clients. Supports multi-account stats.
 */
public record InstagramAccountResponse(
    UUID id,
    String accountName,
    String username,
    String displayName,
    String profilePicture,
    String accountType,
    String igUserId,
    String appId,
    String appSecret,
    String accessToken,
    Boolean isActive,
    Boolean isDefault,
    ConnectionStatus connectionStatus,
    Instant lastSyncedAt,
    Instant lastSuccessfulSync,
    Instant lastFailedSync,
    String syncErrorMessage,
    Instant tokenExpiresAt,
    Instant createdAt,
    Instant updatedAt,
    Long followers,
    Long following,
    Integer posts,
    Integer reels,
    Long reach,
    Long impressions,
    Long engagements,
    Double engagementRate,
    Long followerGrowth
) {}
