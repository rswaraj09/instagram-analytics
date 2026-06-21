package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.dto.PostInsights;
import com.socialmedia.instagram.entity.InstagramPost;
import com.socialmedia.instagram.entity.MonitoringStatus;
import com.socialmedia.instagram.entity.PostMetrics;
import com.socialmedia.instagram.service.GraphApiException;
import com.socialmedia.instagram.service.GraphApiService;
import com.socialmedia.instagram.service.InstagramAccountService;
import com.socialmedia.instagram.service.MetricsCollectionService;
import com.socialmedia.instagram.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * REST Controller for Instagram post management.
 * Role-based access control (Requirements 13.1-13.6).
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

    private final PostService postService;
    private final MetricsCollectionService metricsCollectionService;
    private final GraphApiService graphApiService;
    private final InstagramAccountService accountService;

    // Matches /p/, /reel/, /reels/ and /tv/ Instagram post URLs and captures the shortcode
    private static final Pattern POST_SHORTCODE_PATTERN = Pattern.compile(
        "^https?://(www[.])?instagram[.]com/(p|reel|reels|tv)/([A-Za-z0-9_-]+)/?.*"
    );

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createPost(@AuthenticationPrincipal UUID userId,
                                         @RequestBody CreatePostRequest request) {
        try {
            log.info("Creating new post: {}", request.postUrl());
            InstagramPost post = postService.addPost(request.postUrl(), request.profileId());
            try {
                PostMetrics metrics = metricsCollectionService.collectMetrics(post.getId());
                Map<String, Object> response = new HashMap<>();
                response.put("post", post);
                response.put("metrics", metrics);
                response.put("message", "Post created and metrics collected successfully");
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } catch (Exception e) {
                log.warn("Post created but metrics collection failed: {}", e.getMessage());
                Map<String, Object> response = new HashMap<>();
                response.put("post", post);
                response.put("message", "Post created but metrics collection failed: " + e.getMessage());
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            }
        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to create post: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create post: " + e.getMessage()));
        }
    }

    /**
     * Lookup-only endpoint: fetch live post metrics for a given Instagram post URL
     * via the Graph API, using the caller's linked Instagram account credentials.
     * Does NOT persist anything.
     */
    @PostMapping("/fetch-metrics-by-url")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> fetchMetricsByUrl(@AuthenticationPrincipal UUID userId,
                                               @RequestBody FetchMetricsByUrlRequest request) {
        String postUrl = request.postUrl();
        log.info("Fetching metrics by URL: {}", postUrl);
        String shortcode = extractShortcode(postUrl);
        if (shortcode == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid Instagram post URL"));
        }
        String token = null;
        if (request.graphApiToken() != null && !request.graphApiToken().trim().isEmpty()) {
            token = request.graphApiToken().trim();
        } else {
            Optional<InstagramAccountService.DecryptedCredentials> creds =
                accountService.resolveCredentials(userId, request.accountId());
            if (creds.isPresent()) {
                token = creds.get().accessToken();
            }
        }
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "Failed to fetch post metrics from Instagram API",
                "details", "No Instagram account/access token configured. Add one under Accounts."
            ));
        }
        try {
            String mediaId = graphApiService.getMediaIdFromShortcode(shortcode, token);
            PostInsights insights = graphApiService.fetchPostInsights(mediaId, token);
            long likes = insights.getLikesCount() != null ? insights.getLikesCount() : 0L;
            long comments = insights.getCommentsCount() != null ? insights.getCommentsCount() : 0L;
            long reach = insights.getReach() != null ? insights.getReach() : 0L;
            Map<String, Object> response = new HashMap<>();
            response.put("likesCount", insights.getLikesCount());
            response.put("commentsCount", insights.getCommentsCount());
            response.put("viewsCount", insights.getVideoViews());
            response.put("reach", insights.getReach());
            response.put("impressions", insights.getImpressions());
            response.put("saves", insights.getSaved());
            response.put("engagementRate", metricsCollectionService.calculateEngagementRate(likes, comments, reach));
            return ResponseEntity.ok(response);
        } catch (GraphApiException e) {
            log.error("Graph API error while fetching metrics for {}: {}", postUrl, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "Failed to fetch post metrics from Instagram API",
                "details", e.getMessage()
            ));
        }
    }

    private String extractShortcode(String postUrl) {
        if (postUrl == null || postUrl.isBlank()) {
            return null;
        }
        Matcher matcher = POST_SHORTCODE_PATTERN.matcher(postUrl.trim());
        return matcher.matches() ? matcher.group(3) : null;
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPost(@PathVariable UUID id) {
        try {
            Optional<InstagramPost> postOpt = postService.getPostById(id);
            if (postOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            InstagramPost post = postOpt.get();
            Optional<PostMetrics> latestMetrics = metricsCollectionService.getLatestMetrics(id);
            Map<String, Object> response = new HashMap<>();
            response.put("post", post);
            response.put("latestMetrics", latestMetrics.orElse(null));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get post: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get post: " + e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listPosts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @RequestParam(required = false) UUID profileId
    ) {
        try {
            PageRequest pageRequest = PageRequest.of(page, size);
            Page<InstagramPost> posts;
            if (profileId != null) {
                posts = postService.getPostsByProfile(profileId, pageRequest);
            } else {
                return ResponseEntity.ok(Map.of("message", "List all posts - to be implemented"));
            }
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            log.error("Failed to list posts: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to list posts: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/monitoring-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateMonitoringStatus(
        @PathVariable UUID id,
        @RequestBody UpdateMonitoringStatusRequest request
    ) {
        try {
            InstagramPost post = postService.updateMonitoringStatus(id, request.status());
            return ResponseEntity.ok(post);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to update monitoring status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update monitoring status: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/competitor-flag")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> markAsCompetitorPost(
        @PathVariable UUID id,
        @RequestBody MarkCompetitorRequest request
    ) {
        try {
            InstagramPost post = postService.markAsCompetitorPost(id, request.isCompetitor());
            return ResponseEntity.ok(post);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to mark as competitor: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to mark as competitor: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deletePost(@PathVariable UUID id) {
        try {
            postService.deletePost(id);
            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to delete post: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete post: " + e.getMessage()));
        }
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ANALYST')")
    public ResponseEntity<String> exportPosts() {
        return ResponseEntity.ok("Posts exported (ADMIN, MANAGER, or ANALYST only)");
    }

    public record CreatePostRequest(String postUrl, UUID profileId, UUID accountId) {}
    public record FetchMetricsByUrlRequest(String postUrl, String graphApiToken, UUID accountId) {}
    public record UpdateMonitoringStatusRequest(MonitoringStatus status) {}
    public record MarkCompetitorRequest(boolean isCompetitor) {}
}
