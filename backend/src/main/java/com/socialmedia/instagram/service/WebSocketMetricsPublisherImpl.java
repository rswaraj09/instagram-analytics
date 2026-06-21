package com.socialmedia.instagram.service;

import com.socialmedia.instagram.dto.SpreadsheetUpdate;
import com.socialmedia.instagram.entity.PostMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Implementation of WebSocketMetricsPublisher to broadcast post metrics updates in real-time over WebSocket
 * Requirements 9.3, 9.6
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketMetricsPublisherImpl implements WebSocketMetricsPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void publishMetricsUpdate(PostMetrics metrics) {
        if (metrics == null || metrics.getPost() == null) {
            log.warn("Cannot publish null metrics or metrics without post");
            return;
        }

        String postId = metrics.getPost().getId().toString();
        String destination = "/topic/metrics/" + postId;

        log.info("Broadcasting metrics update to {}: Likes: {}, Comments: {}, Views: {}",
                destination, metrics.getLikesCount(), metrics.getCommentsCount(), metrics.getViewsCount());

        messagingTemplate.convertAndSend(destination, metrics);
    }

    @Override
    public void publishSpreadsheetUpdate(SpreadsheetUpdate update) {
        if (update == null || update.getType() == null) {
            log.warn("Cannot publish null spreadsheet update");
            return;
        }

        String destination = "/topic/spreadsheet/updates";
        log.info("Broadcasting spreadsheet update to {}: type={}, profileUrl={}, postUrl={}",
                destination, update.getType(), update.getProfileUrl(), update.getPostUrl());

        messagingTemplate.convertAndSend(destination, update);
    }
}
