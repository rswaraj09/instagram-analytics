package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Instagram profile info fetched on-demand from the Graph API.
 * Returned by the "lookup only" {@code POST /api/profiles/fetch-by-url} endpoint
 * and never persisted to the database.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileInfo {
    private String username;
    private Long followersCount;
    private Long followingCount;
    private Integer totalPosts;
    private String profilePictureUrl;
    private Boolean isBusinessAccount;
}
