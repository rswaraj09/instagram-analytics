package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a single row of the spreadsheet dashboard, used as the request
 * payload for the export endpoints ({@code POST /api/export/excel|pdf}) and
 * for persisting rows ({@code PUT /api/spreadsheet/rows}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpreadsheetRowDTO {
    private String id;
    private Integer rowOrder;
    private String profileUrl;
    private String username;
    private Long followersCount;
    private Long followingCount;
    private Integer totalPosts;
    private String postUrl;
    private Long likesCount;
    private Long commentsCount;
    private Long viewsCount;
    private Long reach;
}
