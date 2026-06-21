package com.socialmedia.instagram.service;

import com.socialmedia.instagram.dto.PostInsights;
import com.socialmedia.instagram.dto.SpreadsheetUpdate;
import com.socialmedia.instagram.dto.TokenValidation;
import com.socialmedia.instagram.entity.InstagramAccount;
import com.socialmedia.instagram.entity.InstagramPost;
import com.socialmedia.instagram.entity.InstagramProfile;
import com.socialmedia.instagram.entity.MonitoringStatus;
import com.socialmedia.instagram.entity.PostMetrics;
import com.socialmedia.instagram.repository.InstagramPostRepository;
import com.socialmedia.instagram.repository.InstagramProfileRepository;
import com.socialmedia.instagram.repository.PostMetricsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Collects and stores post metrics via the Instagram Graph API. Credentials are
 * resolved per profile from a linked Instagram account (Issue 5/7), falling back
 * to a legacy per-profile token when no account is linked.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MetricsCollectionService {

    private final InstagramPostRepository postRepository;
    private final PostMetricsRepository metricsRepository;
    private final InstagramProfileRepository profileRepository;
    private final GraphApiService graphApiService;
    private final InstagramAccountService accountService;
    private final WebSocketMetricsPublisher wsPublisher;

    public PostMetrics collectMetrics(UUID postId) throws Exception {
        log.info("Collecting metrics for post: {}", postId);
        InstagramPost post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));
        if (post.getMonitoringStatus() != MonitoringStatus.ACTIVE) {
            throw new IllegalStateException("Post monitoring is not active: " + postId);
        }
        try {
            InstagramProfile profile = post.getProfile();
            boolean useGraphApi = profile != null && (
                profile.getInstagramAccount() != null ||
                (profile.getGraphApiToken() != null && !profile.getGraphApiToken().trim().isEmpty())
            );
            PostMetrics metrics;
            if (useGraphApi) {
                log.info("Using Graph API for post {}", postId);
                metrics = collectViaGraphApi(post);
            } else {
                log.error("Cannot collect metrics: no Instagram account or token configured (scraping disabled)");
                throw new IllegalStateException("A linked Instagram account or Graph API token is required. Web scraping is disabled.");
            }
            if (isDuplicateSnapshot(postId, metrics)) {
                log.info("Skipping duplicate snapshot for post: {}", postId);
                return metrics;
            }
            metrics = metricsRepository.save(metrics);
            try {
                wsPublisher.publishMetricsUpdate(metrics);
                publishSpreadsheetUpdate(post, metrics);
            } catch (Exception e) {
                log.error("Failed to publish metrics update via WebSocket: {}", e.getMessage());
            }
            post.setLastFetchedAt(Instant.now());
            postRepository.save(post);
            log.info("Collected metrics for post {}. Likes: {}, Comments: {}, Views: {}, Reach: {}, Impressions: {}",
                postId, metrics.getLikesCount(), metrics.getCommentsCount(), metrics.getViewsCount(),
                metrics.getReach(), metrics.getImpressions());
            return metrics;
        } catch (GraphApiException e) {
            log.error("Failed to collect metrics via Graph API for post {}: {}", postId, e.getMessage());
            if (e.isTokenExpiredError()) {
                handleTokenExpiration(post.getProfile());
            }
            handleCollectionFailure(post, e);
            throw e;
        } catch (Exception e) {
            log.error("Failed to collect metrics for post {}: {}", postId, e.getMessage());
            handleCollectionFailure(post, e);
            throw e;
        }
    }

    private PostMetrics collectViaGraphApi(InstagramPost post) throws GraphApiException {
        InstagramProfile profile = post.getProfile();
        InstagramAccount linked = profile.getInstagramAccount();

        String token;
        String appId = null;
        String appSecret = null;
        boolean haveAppCreds = false;
        if (linked != null) {
            InstagramAccountService.DecryptedCredentials creds = accountService.decrypt(linked);
            token = creds.accessToken();
            appId = creds.appId();
            appSecret = creds.appSecret();
            haveAppCreds = appId != null && !appId.isBlank() && appSecret != null && !appSecret.isBlank();
        } else {
            token = profile.getGraphApiToken();
        }
        if (token == null || token.isBlank()) {
            throw new GraphApiException("No Graph API access token available for profile " + profile.getUsername());
        }
        if (haveAppCreds) {
            try {
                TokenValidation validation = graphApiService.validateToken(token, appId, appSecret);
                if (!validation.isValid() || validation.isExpired()) {
                    log.warn("Token invalid/expired for profile {}, attempting refresh", profile.getUsername());
                    String refreshed = graphApiService.refreshAccessToken(token, appId, appSecret);
                    if (refreshed != null && !refreshed.isBlank()) {
                        token = refreshed;
                        if (linked == null) {
                            profile.setGraphApiToken(token);
                            profileRepository.save(profile);
                        }
                    }
                }
            } catch (GraphApiException e) {
                log.error("Failed to validate/refresh token: {}", e.getMessage());
            }
        }
        String mediaId = graphApiService.getMediaIdFromShortcode(post.getPostShortcode(), token);
        PostInsights insights = graphApiService.fetchPostInsights(mediaId, token);
        long likesCount = insights.getLikesCount() != null ? insights.getLikesCount() : 0L;
        long commentsCount = insights.getCommentsCount() != null ? insights.getCommentsCount() : 0L;
        long reach = insights.getReach() != null ? insights.getReach() : 0L;
        BigDecimal engagementRate = calculateEngagementRate(likesCount, commentsCount, reach);
        return PostMetrics.builder()
            .post(post)
            .likesCount(likesCount)
            .commentsCount(commentsCount)
            .viewsCount(insights.getVideoViews())
            .videoViews(insights.getVideoViews())
            .reach(insights.getReach())
            .impressions(insights.getImpressions())
            .saves(insights.getSaved())
            .shares(insights.getShares())
            .profileVisits(insights.getProfileVisits())
            .engagementRate(engagementRate)
            .isEstimated(false)
            .fetchedAt(Instant.now())
            .build();
    }

    private void handleTokenExpiration(InstagramProfile profile) {
        if (profile == null) {
            return;
        }
        log.error("Token expired for profile: {}", profile.getUsername());
        InstagramAccount linked = profile.getInstagramAccount();
        if (linked == null) {
            profile.setGraphApiToken(null);
            profileRepository.save(profile);
            log.warn("Cleared expired token for profile {} (no app credentials available to refresh).", profile.getUsername());
            return;
        }
        try {
            InstagramAccountService.DecryptedCredentials creds = accountService.decrypt(linked);
            if (creds.appId() == null || creds.appId().isBlank() || creds.appSecret() == null || creds.appSecret().isBlank()) {
                log.warn("No app credentials to refresh token for profile {}.", profile.getUsername());
                return;
            }
            graphApiService.refreshAccessToken(creds.accessToken(), creds.appId(), creds.appSecret());
            log.info("Refreshed token for profile {} (account {}).", profile.getUsername(), linked.getId());
        } catch (GraphApiException e) {
            log.error("Failed to refresh token for profile {}: {}", profile.getUsername(), e.getMessage());
        }
    }

    public long calculateEstimatedReach(long likesCount) {
        if (likesCount == 0) {
            return 0L;
        }
        double multiplier = ThreadLocalRandom.current().nextDouble(5.0, 8.0);
        return (long) (likesCount * multiplier);
    }

    public long calculateEstimatedImpressions(long reach) {
        return (long) (reach * 1.2);
    }

    public BigDecimal calculateEngagementRate(long likesCount, long commentsCount, long reach) {
        long engagements = likesCount + commentsCount;
        long denominator = reach > 0 ? reach : likesCount * 6;
        if (denominator == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(engagements)
            .divide(BigDecimal.valueOf(denominator), 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));
    }

    private boolean isDuplicateSnapshot(UUID postId, PostMetrics metrics) {
        Instant thirtySecondsAgo = Instant.now().minusSeconds(30);
        Optional<PostMetrics> latestOpt = metricsRepository.findLatestByPostIdSince(postId, thirtySecondsAgo);
        if (latestOpt.isEmpty()) {
            return false;
        }
        PostMetrics latest = latestOpt.get();
        boolean likesMatch = safeEquals(latest.getLikesCount(), metrics.getLikesCount());
        boolean commentsMatch = safeEquals(latest.getCommentsCount(), metrics.getCommentsCount());
        boolean viewsMatch = safeEquals(latest.getViewsCount(), metrics.getViewsCount());
        return likesMatch && commentsMatch && viewsMatch;
    }

    private boolean safeEquals(Long a, Long b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    private void handleCollectionFailure(InstagramPost post, Exception e) {
        log.error("Collection failed for post {}: {}", post.getId(), e.getMessage());
        post.setMonitoringStatus(MonitoringStatus.ERROR);
        postRepository.save(post);
    }

    private void publishSpreadsheetUpdate(InstagramPost post, PostMetrics metrics) {
        if (post.getPostUrl() == null) {
            return;
        }
        Map<String, Object> data = new HashMap<>();
        data.put("likesCount", metrics.getLikesCount());
        data.put("commentsCount", metrics.getCommentsCount());
        data.put("viewsCount", metrics.getViewsCount());
        data.put("reach", metrics.getReach());
        wsPublisher.publishSpreadsheetUpdate(SpreadsheetUpdate.builder()
            .type(SpreadsheetUpdate.TYPE_POST_METRICS_UPDATE)
            .postUrl(post.getPostUrl())
            .data(data)
            .build());
    }

    @Transactional(readOnly = true)
    public Optional<PostMetrics> getLatestMetrics(UUID postId) {
        return metricsRepository.findLatestByPostId(postId);
    }
}
