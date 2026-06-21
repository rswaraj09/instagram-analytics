package com.socialmedia.instagram.dto;

import jakarta.validation.constraints.Size;

import java.time.Instant;

public record UpdateInstagramAccountRequest(
    @Size(max = 255) String accountName,
    @Size(max = 255) String appId,
    @Size(max = 1000) String appSecret,
    @Size(max = 2000) String accessToken,
    Boolean isActive,
    Instant tokenExpiresAt
) {}
