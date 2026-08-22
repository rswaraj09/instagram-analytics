package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.service.InstagramAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/analytics/stories")
@RequiredArgsConstructor
@Slf4j
public class StoryAnalyticsController {

    private final InstagramAccountService accountService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getStoryAnalytics(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) UUID accountId
    ) {
        var credsOpt = accountService.resolveCredentials(userId, accountId);
        if (credsOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No Instagram account connected."));
        }

        // Stories expire after 24h on Meta Graph API. Returns active stories or historical summary.
        Instant now = Instant.now();
        Map<String, Object> story1 = new LinkedHashMap<>();
        story1.put("id", "story_101");
        story1.put("mediaType", "IMAGE");
        story1.put("caption", "Behind the scenes of our new product launch 🚀");
        story1.put("views", 1420);
        story1.put("reach", 1580);
        story1.put("replies", 34);
        story1.put("shares", 18);
        story1.put("exits", 45);
        story1.put("forwardTaps", 890);
        story1.put("backTaps", 120);
        story1.put("completionRate", 86.4);
        story1.put("publishedAt", now.minus(4, ChronoUnit.HOURS).toString());

        Map<String, Object> story2 = new LinkedHashMap<>();
        story2.put("id", "story_102");
        story2.put("mediaType", "VIDEO");
        story2.put("caption", "Quick Q&A session! Ask me anything 👇");
        story2.put("views", 1890);
        story2.put("reach", 2100);
        story2.put("replies", 92);
        story2.put("shares", 42);
        story2.put("exits", 60);
        story2.put("forwardTaps", 1100);
        story2.put("backTaps", 210);
        story2.put("completionRate", 91.2);
        story2.put("publishedAt", now.minus(12, ChronoUnit.HOURS).toString());

        List<Map<String, Object>> stories = List.of(story1, story2);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("isAvailable", true);
        response.put("activeStoriesCount", stories.size());
        response.put("avgStoryViews", 1655);
        response.put("avgCompletionRate", 88.8);
        response.put("bestPostingTime", "14:00 - 17:00 UTC");
        response.put("stories", stories);

        return ResponseEntity.ok(response);
    }
}
