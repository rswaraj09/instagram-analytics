package com.socialmedia.instagram.service;

import com.socialmedia.instagram.dto.SpreadsheetUpdate;
import com.socialmedia.instagram.entity.PostMetrics;

/**
 * Publisher service interface to broadcast post metrics updates in real-time over WebSocket
 * Requirements 9.3, 9.6
 */
public interface WebSocketMetricsPublisher {

    /**
     * Publish metrics update to the topic /topic/metrics/{postId}
     *
     * @param metrics Saved PostMetrics snapshot
     */
    void publishMetricsUpdate(PostMetrics metrics);

    /**
     * Publish a spreadsheet dashboard update to /topic/spreadsheet/updates so the
     * AG Grid view can update the matching row in real-time.
     *
     * @param update the spreadsheet update payload
     */
    void publishSpreadsheetUpdate(SpreadsheetUpdate update);
}
