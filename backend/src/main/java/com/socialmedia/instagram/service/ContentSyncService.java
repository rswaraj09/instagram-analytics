package com.socialmedia.instagram.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialmedia.instagram.dto.MediaItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Fetches all media items (posts + reels) for an Instagram Business Account
 * with full analytics data (insights) via the Graph API.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContentSyncService {

    private static final String GRAPH_API_VERSION = "v18.0";
    private static final String GRAPH_API_BASE = "https://graph.facebook.com/" + GRAPH_API_VERSION;

    private static final String MEDIA_FIELDS = "id,shortcode,media_type,media_product_type,caption,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";

    // Insights available for FEED / CAROUSEL posts
    private static final String FEED_INSIGHTS = "reach,impressions,saved,profile_visits,video_views";

    // Insights available for REELS
    private static final String REELS_INSIGHTS = "reach,plays,saved,shares,total_interactions,video_view_total_time,avg_watch_time";

    // Insights available for VIDEO posts (non-reel)
    private static final String VIDEO_INSIGHTS = "reach,impressions,saved,video_views,profile_visits";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    /**
     * Fetch all media items for an account, populated with insights.
     *
     * @param igUserId    Instagram Business Account ID
     * @param accessToken Valid access token
     * @param limit       Max items per page (up to 100)
     * @return list of MediaItem with all available analytics
     */
    public List<MediaItem> syncAllMedia(String igUserId, String accessToken, int limit) throws GraphApiException {
        log.info("Starting full media sync for IG account: {}", igUserId);
        List<MediaItem> all = new ArrayList<>();

        // Step 1: fetch paginated list of media IDs + basic fields
        String url = buildMediaListUrl(igUserId, accessToken, Math.min(limit, 100));

        while (url != null) {
            try {
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(30))
                        .GET().build();

                HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());

                if (resp.statusCode() >= 400) {
                    log.error("Media list fetch failed with status {}", resp.statusCode());
                    break;
                }

                JsonNode root = objectMapper.readTree(resp.body());
                JsonNode data = root.path("data");

                if (data.isArray()) {
                    for (JsonNode node : data) {
                        MediaItem item = parseMediaNode(node, accessToken);
                        if (item != null) {
                            all.add(item);
                        }
                    }
                }

                // Pagination
                JsonNode next = root.path("paging").path("next");
                url = (!next.isMissingNode() && !next.isNull()) ? next.asText() : null;

            } catch (IOException | InterruptedException e) {
                log.error("Error during media sync: {}", e.getMessage());
                throw new GraphApiException("Network error during media sync", e);
            }
        }

        log.info("Synced {} media items for IG account {}", all.size(), igUserId);
        return all;
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private String buildMediaListUrl(String igUserId, String token, int limit) {
        return String.format("%s/%s/media?fields=%s&limit=%d&access_token=%s",
                GRAPH_API_BASE,
                URLEncoder.encode(igUserId, StandardCharsets.UTF_8),
                URLEncoder.encode(MEDIA_FIELDS, StandardCharsets.UTF_8),
                limit,
                URLEncoder.encode(token, StandardCharsets.UTF_8));
    }

    private MediaItem parseMediaNode(JsonNode node, String accessToken) {
        try {
            String id = node.path("id").asText(null);
            if (id == null)
                return null;

            String shortcode = node.path("shortcode").asText(null);
            String mediaType = node.path("media_type").asText("IMAGE");
            String mediaProductType = node.path("media_product_type").asText("FEED");
            String caption = node.path("caption").asText(null);
            String mediaUrl = node.path("media_url").asText(null);
            String thumbnailUrl = node.path("thumbnail_url").asText(null);
            String permalink = node.path("permalink").asText(null);

            Instant timestamp = null;
            String tsStr = node.path("timestamp").asText(null);
            if (tsStr != null) {
                try {
                    // Instagram returns +0000, which ISO_OFFSET_DATE_TIME doesn't like without a
                    // colon
                    if (tsStr.matches(".*[+-]\\d{4}$")) {
                        tsStr = tsStr.substring(0, tsStr.length() - 2) + ":" + tsStr.substring(tsStr.length() - 2);
                    }
                    timestamp = Instant.from(DateTimeFormatter.ISO_OFFSET_DATE_TIME.parse(tsStr));
                } catch (Exception e) {
                    log.warn("Failed to parse timestamp: {}", tsStr, e);
                }
            }

            long likeCount = node.path("like_count").asLong(0);
            long commentsCount = node.path("comments_count").asLong(0);

            MediaItem.MediaItemBuilder builder = MediaItem.builder()
                    .id(id)
                    .shortcode(shortcode)
                    .mediaType(mediaType)
                    .mediaProductType(mediaProductType)
                    .caption(caption)
                    .mediaUrl(mediaUrl)
                    .thumbnailUrl("VIDEO".equals(mediaType) && thumbnailUrl == null ? mediaUrl : thumbnailUrl)
                    .permalink(permalink)
                    .timestamp(timestamp)
                    .likeCount(likeCount)
                    .commentsCount(commentsCount);

            // Fetch insights for this specific media
            fetchInsights(id, mediaType, mediaProductType, accessToken, builder);

            MediaItem item = builder.build();

            // Compute engagement rate
            long denominator = item.getReach() != null && item.getReach() > 0
                    ? item.getReach()
                    : likeCount * 6;
            if (denominator > 0) {
                double eng = ((double) (likeCount + commentsCount)) / denominator * 100.0;
                item.setEngagementRate(Math.round(eng * 100.0) / 100.0);
            }

            return item;
        } catch (Exception e) {
            log.warn("Failed to parse media node: {}", e.getMessage());
            return null;
        }
    }

    private void fetchInsights(String mediaId, String mediaType, String mediaProductType,
            String accessToken, MediaItem.MediaItemBuilder builder) {
        try {
            String metrics;
            if ("REELS".equalsIgnoreCase(mediaProductType)) {
                metrics = REELS_INSIGHTS;
            } else if ("VIDEO".equalsIgnoreCase(mediaType)) {
                metrics = VIDEO_INSIGHTS;
            } else {
                metrics = FEED_INSIGHTS;
            }

            String url = String.format("%s/%s/insights?metric=%s&access_token=%s",
                    GRAPH_API_BASE,
                    URLEncoder.encode(mediaId, StandardCharsets.UTF_8),
                    URLEncoder.encode(metrics, StandardCharsets.UTF_8),
                    URLEncoder.encode(accessToken, StandardCharsets.UTF_8));

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(20))
                    .GET().build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(resp.body());
                JsonNode data = root.path("data");
                if (data.isArray()) {
                    for (JsonNode metric : data) {
                        String name = metric.path("name").asText();
                        long value = metric.path("values").path(0).path("value").asLong(
                                metric.path("value").asLong(0));

                        switch (name) {
                            case "reach" -> builder.reach(value);
                            case "impressions" -> builder.impressions(value);
                            case "saved" -> builder.saved(value);
                            case "video_views", "views" -> builder.videoViews(value);
                            case "plays" -> builder.plays(value);
                            case "shares" -> builder.shares(value);
                            case "profile_visits" -> builder.profileVisits(value);
                            case "follows" -> builder.follows(value);
                            case "clicks", "website_clicks", "link_clicks" -> builder.clicks(value);
                            case "total_interactions" -> builder.totalInteractions(value);
                            case "video_view_total_time" -> builder.videoViewTotalTime(value);
                            case "avg_watch_time" -> builder.avgWatchTime(value);
                            default -> {
                            }
                        }
                    }
                }
            } else {
                log.debug("Could not fetch insights for media {}: HTTP {}", mediaId, resp.statusCode());
            }
        } catch (Exception e) {
            log.debug("Error fetching insights for {}: {}", mediaId, e.getMessage());
        }
    }
}
