package com.socialmedia.instagram.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialmedia.instagram.dto.PostInsights;
import com.socialmedia.instagram.dto.ProfileInfo;
import com.socialmedia.instagram.dto.TokenValidation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Implementation of GraphApiService using Instagram Graph API v18.0.
 * All credentials are passed in per call (Issue 7); no global app config.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InstagramGraphApiService implements GraphApiService {

    private static final String GRAPH_API_VERSION = "v18.0";
    private static final String GRAPH_API_BASE_URL = "https://graph.facebook.com/" + GRAPH_API_VERSION;

    private static final Pattern PROFILE_URL_PATTERN = Pattern.compile(
        "^https?://(www[.])?instagram[.]com/([a-zA-Z0-9._]+)/?$"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();

    @Override
    @Retryable(
        retryFor = {GraphApiException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 60000, multiplier = 2)
    )
    public PostInsights fetchPostInsights(String mediaId, String accessToken) throws GraphApiException {
        log.info("Fetching insights for media ID: {}", mediaId);

        if (mediaId == null || mediaId.trim().isEmpty()) {
            throw new GraphApiException("Media ID cannot be null or empty");
        }
        if (accessToken == null || accessToken.trim().isEmpty()) {
            throw new GraphApiException("Access token cannot be null or empty");
        }

        try {
            PostInsights.PostInsightsBuilder builder = PostInsights.builder().mediaId(mediaId);

            String[] mediaDetails = getMediaTypeAndProductType(mediaId, accessToken, builder);
            String mediaType = mediaDetails[0];
            String mediaProductType = mediaDetails[1];

            String metricsParam;
            if ("REELS".equalsIgnoreCase(mediaProductType)) {
                metricsParam = "reach,views,saved";
            } else if ("VIDEO".equalsIgnoreCase(mediaType)) {
                metricsParam = "impressions,reach,saved,views";
            } else {
                metricsParam = "impressions,reach,saved";
            }

            String url = String.format("%s/%s/insights?metric=%s&access_token=%s",
                GRAPH_API_BASE_URL,
                URLEncoder.encode(mediaId, StandardCharsets.UTF_8),
                URLEncoder.encode(metricsParam, StandardCharsets.UTF_8),
                URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.debug("Graph API insights response status: {}", response.statusCode());

            if (response.statusCode() >= 400) {
                handleErrorResponse(response);
                return null;
            }

            return parseInsightsResponse(mediaId, response.body(), builder);

        } catch (IOException | InterruptedException e) {
            log.error("Failed to fetch insights for media {}: {}", mediaId, e.getMessage());
            throw new GraphApiException("Network error while fetching insights", e);
        }
    }

    @Override
    @Retryable(
        retryFor = {GraphApiException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 60000, multiplier = 2)
    )
    public ProfileInfo fetchProfileInfo(String profileUrl, String igUserId, String accessToken) throws GraphApiException {
        String username = extractUsernameFromUrl(profileUrl);
        if (username == null) {
            throw new GraphApiException("Invalid Instagram profile URL: " + profileUrl, 400, "INVALID_URL");
        }
        if (accessToken == null || accessToken.trim().isEmpty()) {
            throw new GraphApiException("Instagram Graph API access token is not configured", 502, "NOT_CONFIGURED");
        }
        if (igUserId == null || igUserId.trim().isEmpty()) {
            throw new GraphApiException("Instagram Business Account ID is not configured", 502, "NOT_CONFIGURED");
        }

        log.info("Fetching profile info for username: {}", username);

        try {
            String fields = String.format(
                "business_discovery.username(%s){username,followers_count,follows_count,media_count,profile_picture_url}",
                username);

            String url = String.format("%s/%s?fields=%s&access_token=%s",
                GRAPH_API_BASE_URL,
                URLEncoder.encode(igUserId.trim(), StandardCharsets.UTF_8),
                URLEncoder.encode(fields, StandardCharsets.UTF_8),
                URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.debug("Graph API business discovery response status: {}", response.statusCode());

            if (response.statusCode() >= 400) {
                handleErrorResponse(response);
                return null;
            }

            return parseProfileInfoResponse(response.body());

        } catch (IOException | InterruptedException e) {
            log.error("Failed to fetch profile info for {}: {}", username, e.getMessage());
            throw new GraphApiException("Network error while fetching profile info", e);
        }
    }

    private ProfileInfo parseProfileInfoResponse(String responseBody) throws GraphApiException {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode discovery = root.path("business_discovery");

            if (discovery.isMissingNode() || discovery.isNull()) {
                throw new GraphApiException("No profile data returned by Instagram API");
            }

            String username = discovery.path("username").asText(null);
            long followers = discovery.path("followers_count").asLong(0);
            long following = discovery.path("follows_count").asLong(0);
            int mediaCount = discovery.path("media_count").asInt(0);
            String pictureUrl = discovery.path("profile_picture_url").asText(null);

            ProfileInfo info = ProfileInfo.builder()
                .username(username)
                .followersCount(followers)
                .followingCount(following)
                .totalPosts(mediaCount)
                .profilePictureUrl(pictureUrl)
                .isBusinessAccount(true)
                .build();

            log.info("Successfully fetched profile info for {}: followers={}, following={}, posts={}",
                username, followers, following, mediaCount);

            return info;
        } catch (GraphApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse profile info response: {}", e.getMessage());
            throw new GraphApiException("Failed to parse profile info response", e);
        }
    }

    private String extractUsernameFromUrl(String profileUrl) {
        if (profileUrl == null) {
            return null;
        }
        Matcher matcher = PROFILE_URL_PATTERN.matcher(profileUrl.trim());
        return matcher.matches() ? matcher.group(2) : null;
    }

    private String[] getMediaTypeAndProductType(String mediaId, String accessToken,
                                                PostInsights.PostInsightsBuilder builder) throws GraphApiException {
        try {
            String url = String.format("%s/%s?fields=media_type,media_product_type,like_count,comments_count&access_token=%s",
                GRAPH_API_BASE_URL,
                URLEncoder.encode(mediaId, StandardCharsets.UTF_8),
                URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String mediaType = root.path("media_type").asText("IMAGE");
                String mediaProductType = root.path("media_product_type").asText("FEED");
                long likes = root.path("like_count").asLong(0);
                long comments = root.path("comments_count").asLong(0);

                builder.likesCount(likes);
                builder.commentsCount(comments);

                log.debug("Media ID {} details: type={}, productType={}, likes={}, comments={}",
                    mediaId, mediaType, mediaProductType, likes, comments);
                return new String[]{mediaType, mediaProductType};
            } else {
                log.warn("Failed to fetch media details, status: {}", response.statusCode());
                handleErrorResponse(response);
                return new String[]{"IMAGE", "FEED"};
            }
        } catch (IOException | InterruptedException e) {
            log.error("Failed to fetch media details: {}", e.getMessage());
            throw new GraphApiException("Network error while fetching media details", e);
        }
    }

    private PostInsights parseInsightsResponse(String mediaId, String responseBody,
                                               PostInsights.PostInsightsBuilder builder) throws GraphApiException {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode data = root.path("data");

            if (data.isArray()) {
                for (JsonNode metric : data) {
                    String name = metric.path("name").asText();
                    long value = metric.path("values").path(0).path("value").asLong(0);

                    switch (name) {
                        case "impressions":
                            builder.impressions(value);
                            break;
                        case "reach":
                            builder.reach(value);
                            break;
                        case "saved":
                            builder.saved(value);
                            break;
                        case "views":
                        case "video_views":
                        case "plays":
                            builder.videoViews(value);
                            break;
                        default:
                            break;
                    }
                }
            }

            PostInsights insights = builder.build();
            log.info("Successfully fetched insights for media {}. Reach: {}, Impressions: {}, Likes: {}, Comments: {}",
                mediaId, insights.getReach(), insights.getImpressions(),
                insights.getLikesCount(), insights.getCommentsCount());
            return insights;
        } catch (Exception e) {
            log.error("Failed to parse insights response: {}", e.getMessage());
            throw new GraphApiException("Failed to parse insights response", e);
        }
    }

    @Override
    public TokenValidation validateToken(String accessToken, String appId, String appSecret) throws GraphApiException {
        log.info("Validating Graph API token");

        if (accessToken == null || accessToken.trim().isEmpty()) {
            throw new GraphApiException("Access token cannot be null or empty");
        }
        if (appId == null || appId.trim().isEmpty() || appSecret == null || appSecret.trim().isEmpty()) {
            throw new GraphApiException("App ID and App Secret must be provided");
        }

        try {
            String url = String.format("%s/debug_token?input_token=%s&access_token=%s|%s",
                GRAPH_API_BASE_URL,
                URLEncoder.encode(accessToken, StandardCharsets.UTF_8),
                URLEncoder.encode(appId, StandardCharsets.UTF_8),
                URLEncoder.encode(appSecret, StandardCharsets.UTF_8)
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                log.error("Token validation failed with status: {}", response.statusCode());
                return TokenValidation.builder()
                    .isValid(false)
                    .errorMessage("Token validation failed")
                    .build();
            }

            return parseTokenValidationResponse(response.body());
        } catch (IOException | InterruptedException e) {
            log.error("Failed to validate token: {}", e.getMessage());
            throw new GraphApiException("Network error while validating token", e);
        }
    }

    private TokenValidation parseTokenValidationResponse(String responseBody) throws GraphApiException {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode data = root.path("data");

            boolean isValid = data.path("is_valid").asBoolean(false);
            String appId = data.path("app_id").asText(null);
            String userId = data.path("user_id").asText(null);

            long expiresAtTimestamp = data.path("expires_at").asLong(0);
            Instant expiresAt = expiresAtTimestamp > 0 ? Instant.ofEpochSecond(expiresAtTimestamp) : null;

            long issuedAtTimestamp = data.path("issued_at").asLong(0);
            Instant issuedAt = issuedAtTimestamp > 0 ? Instant.ofEpochSecond(issuedAtTimestamp) : null;

            JsonNode scopesNode = data.path("scopes");
            String[] scopes = null;
            if (scopesNode.isArray()) {
                scopes = new String[scopesNode.size()];
                for (int i = 0; i < scopesNode.size(); i++) {
                    scopes[i] = scopesNode.get(i).asText();
                }
            }

            TokenValidation validation = TokenValidation.builder()
                .isValid(isValid)
                .appId(appId)
                .userId(userId)
                .expiresAt(expiresAt)
                .issuedAt(issuedAt)
                .scopes(scopes)
                .build();

            log.info("Token validation result: isValid={}, expiresAt={}", isValid, expiresAt);
            return validation;
        } catch (Exception e) {
            log.error("Failed to parse token validation response: {}", e.getMessage());
            throw new GraphApiException("Failed to parse token validation response", e);
        }
    }

    @Override
    public String refreshAccessToken(String currentToken, String appId, String appSecret) throws GraphApiException {
        log.info("Refreshing Graph API access token");

        if (currentToken == null || currentToken.trim().isEmpty()) {
            throw new GraphApiException("Current token cannot be null or empty");
        }
        if (appId == null || appId.trim().isEmpty() || appSecret == null || appSecret.trim().isEmpty()) {
            throw new GraphApiException("App ID and App Secret must be provided");
        }

        try {
            String url = String.format("%s/oauth/access_token?grant_type=fb_exchange_token&client_id=%s&client_secret=%s&fb_exchange_token=%s",
                GRAPH_API_BASE_URL,
                URLEncoder.encode(appId, StandardCharsets.UTF_8),
                URLEncoder.encode(appSecret, StandardCharsets.UTF_8),
                URLEncoder.encode(currentToken, StandardCharsets.UTF_8)
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                log.error("Token refresh failed with status: {}", response.statusCode());
                handleErrorResponse(response);
                return null;
            }

            return parseTokenRefreshResponse(response.body());
        } catch (IOException | InterruptedException e) {
            log.error("Failed to refresh token: {}", e.getMessage());
            throw new GraphApiException("Network error while refreshing token", e);
        }
    }

    private String parseTokenRefreshResponse(String responseBody) throws GraphApiException {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String newToken = root.path("access_token").asText(null);

            if (newToken == null || newToken.isEmpty()) {
                throw new GraphApiException("No access token in refresh response");
            }

            long expiresIn = root.path("expires_in").asLong(0);
            log.info("Token refreshed successfully, expires in {} seconds", expiresIn);
            return newToken;
        } catch (Exception e) {
            log.error("Failed to parse token refresh response: {}", e.getMessage());
            throw new GraphApiException("Failed to parse token refresh response", e);
        }
    }

    private void handleErrorResponse(HttpResponse<String> response) throws GraphApiException {
        int statusCode = response.statusCode();
        String body = response.body();

        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode error = root.path("error");

            String message = error.path("message").asText("Unknown error");
            int errorCode = error.path("code").asInt(0);
            String errorType = error.path("type").asText(null);

            log.error("Graph API error: code={}, type={}, message={}", errorCode, errorType, message);

            if (statusCode == 429 || "OAuthException".equals(errorType)) {
                throw new GraphApiException("Rate limit exceeded: " + message, statusCode,
                    errorType != null ? errorType : "RATE_LIMIT");
            }
            if (errorCode == 190 || "OAuthException".equals(errorType)) {
                throw new GraphApiException("Token expired or invalid: " + message, statusCode,
                    errorType != null ? errorType : "TOKEN_EXPIRED");
            }
            throw new GraphApiException(message, statusCode, errorType != null ? errorType : "UNKNOWN");
        } catch (Exception e) {
            if (e instanceof GraphApiException) {
                throw (GraphApiException) e;
            }
            throw new GraphApiException("HTTP " + statusCode + ": " + body, statusCode, "HTTP_ERROR");
        }
    }

    @Override
    public String getMediaIdFromShortcode(String shortcode, String accessToken) throws GraphApiException {
        log.info("Getting media ID for shortcode: {}", shortcode);

        if (shortcode == null || shortcode.trim().isEmpty()) {
            throw new GraphApiException("Shortcode cannot be null or empty");
        }
        if (accessToken == null || accessToken.trim().isEmpty()) {
            throw new GraphApiException("Access token cannot be null or empty");
        }

        try {
            String resolvedIgUserId = resolveIgUserId(accessToken);

            String mediaUrl = String.format("%s/%s/media?fields=id,shortcode&limit=100&access_token=%s",
                GRAPH_API_BASE_URL,
                URLEncoder.encode(resolvedIgUserId, StandardCharsets.UTF_8),
                URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
            );

            while (mediaUrl != null && !mediaUrl.isEmpty()) {
                HttpRequest mediaRequest = HttpRequest.newBuilder()
                    .uri(URI.create(mediaUrl))
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();

                HttpResponse<String> mediaResponse = httpClient.send(mediaRequest, HttpResponse.BodyHandlers.ofString());

                if (mediaResponse.statusCode() >= 400) {
                    log.error("Failed to fetch media: status {}", mediaResponse.statusCode());
                    handleErrorResponse(mediaResponse);
                }

                JsonNode mediaRoot = objectMapper.readTree(mediaResponse.body());
                JsonNode mediaArray = mediaRoot.path("data");

                if (mediaArray.isArray()) {
                    for (JsonNode mediaItem : mediaArray) {
                        String itemShortcode = mediaItem.path("shortcode").asText(null);
                        if (shortcode.equals(itemShortcode)) {
                            String mediaId = mediaItem.path("id").asText();
                            log.info("Successfully found Media ID {} for shortcode {}", mediaId, shortcode);
                            return mediaId;
                        }
                    }
                }

                JsonNode paging = mediaRoot.path("paging");
                JsonNode nextNode = paging.path("next");
                if (!nextNode.isMissingNode() && !nextNode.isNull()) {
                    mediaUrl = nextNode.asText();
                } else {
                    mediaUrl = null;
                }
            }

            throw new GraphApiException("Media with shortcode " + shortcode + " not found for this account");
        } catch (IOException | InterruptedException e) {
            log.error("Failed to fetch media ID for shortcode {}: {}", shortcode, e.getMessage());
            throw new GraphApiException("Network error while resolving shortcode", e);
        }
    }

    @Override
    public String resolveIgUserId(String accessToken) throws GraphApiException {
        log.info("Resolving Instagram Business Account ID from access token");

        if (accessToken == null || accessToken.trim().isEmpty()) {
            throw new GraphApiException("Access token cannot be null or empty");
        }

        try {
            String accountsUrl = String.format("%s/me/accounts?fields=instagram_business_account&access_token=%s",
                GRAPH_API_BASE_URL,
                URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
            );

            HttpRequest accountsRequest = HttpRequest.newBuilder()
                .uri(URI.create(accountsUrl))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

            HttpResponse<String> accountsResponse = httpClient.send(accountsRequest, HttpResponse.BodyHandlers.ofString());

            if (accountsResponse.statusCode() >= 400) {
                log.error("Failed to fetch accounts: status {}", accountsResponse.statusCode());
                handleErrorResponse(accountsResponse);
            }

            JsonNode accountsRoot = objectMapper.readTree(accountsResponse.body());
            JsonNode dataArray = accountsRoot.path("data");

            if (dataArray.isArray()) {
                for (JsonNode pageNode : dataArray) {
                    JsonNode igAccountNode = pageNode.path("instagram_business_account");
                    if (!igAccountNode.isMissingNode() && !igAccountNode.isNull()) {
                        String igUserId = igAccountNode.path("id").asText();
                        log.info("Resolved Instagram Business Account ID: {}", igUserId);
                        return igUserId;
                    }
                }
            }

            throw new GraphApiException("No Instagram Business Account found linked to the provided access token");
        } catch (IOException | InterruptedException e) {
            log.error("Failed to resolve IG User ID: {}", e.getMessage());
            throw new GraphApiException("Network error while resolving Instagram Business Account ID", e);
        }
    }
}

