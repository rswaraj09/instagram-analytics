package com.socialmedia.instagram.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getNotifications(@AuthenticationPrincipal UUID userId) {
        List<Map<String, Object>> notifications = List.of(
            Map.of(
                "id", "notif_1",
                "title", "🎉 Reel Crossed Milestone!",
                "message", "Your latest Reel crossed 25,000 views in less than 48 hours.",
                "type", "HIGH_PERFORMING_REEL",
                "read", false,
                "timestamp", new Date(System.currentTimeMillis() - 3600000).toString()
            ),
            Map.of(
                "id", "notif_2",
                "title", "📈 Growth Spike Alert",
                "message", "Account gained +240 new followers following Wednesday's viral post.",
                "type", "FOLLOWER_INCREASE",
                "read", false,
                "timestamp", new Date(System.currentTimeMillis() - 86400000).toString()
            ),
            Map.of(
                "id", "notif_3",
                "title", "📊 Weekly Report Ready",
                "message", "Your weekly performance & competitor comparison summary is ready.",
                "type", "REPORT_READY",
                "read", true,
                "timestamp", new Date(System.currentTimeMillis() - 172800000).toString()
            )
        );

        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        return ResponseEntity.ok(Map.of("message", "Notification marked as read.", "id", id));
    }
}
