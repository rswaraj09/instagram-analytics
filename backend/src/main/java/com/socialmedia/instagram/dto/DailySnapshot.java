package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A daily aggregated snapshot for trend analysis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySnapshot {
    private String date;         // yyyy-MM-dd
    private long views;
    private long likes;
    private long comments;
    private long shares;
    private long saves;
    private long reach;
    private long impressions;
    private double engagementRate;
}
