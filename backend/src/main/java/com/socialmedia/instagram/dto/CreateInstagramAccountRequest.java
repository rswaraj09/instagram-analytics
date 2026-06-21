package com.socialmedia.instagram.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateInstagramAccountRequest(
    @NotBlank @Size(max = 255) String accountName,
    @Size(max = 255) String igUserId,
    @NotBlank @Size(max = 255) String appId,
    @NotBlank @Size(max = 1000) String appSecret,
    @NotBlank @Size(max = 2000) String accessToken,
    Instant tokenExpiresAt
) {}

