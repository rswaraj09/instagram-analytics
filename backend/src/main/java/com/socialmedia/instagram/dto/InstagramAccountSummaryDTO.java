package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstagramAccountSummaryDTO {
    private String id;
    private String username;
    private String displayName;
    private String profilePictureUrl;
    private String profilePicture;
    private String igUserId;
    private String profileUrl;
}
