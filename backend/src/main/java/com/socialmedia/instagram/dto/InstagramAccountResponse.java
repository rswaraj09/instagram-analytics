package com.socialmedia.instagram.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response view of an Instagram account. The appSecret and accessToken fields
 * are masked - raw secrets are never returned to clients.
 */
public record InstagramAccountResponse(
    UUID id,
    String accountName,
    String igUserId,
    String appId,
    String appSecret,
    String accessToken,
    Boolean isActive,
    Instant tokenExpiresAt,
    Instant createdAt,
    Instant updatedAt
) {}
