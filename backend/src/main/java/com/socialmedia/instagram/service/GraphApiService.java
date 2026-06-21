package com.socialmedia.instagram.service;

import com.socialmedia.instagram.dto.PostInsights;
import com.socialmedia.instagram.dto.ProfileInfo;
import com.socialmedia.instagram.dto.TokenValidation;

/**
 * Service interface for Instagram Graph API integration.
 * Credentials are supplied per call (per-account) - the service holds no global
 * app credentials (Issue 7).
 */
public interface GraphApiService {

    /**
     * Fetch post insights from Instagram Graph API.
     *
     * @param mediaId     Instagram media ID
     * @param accessToken Valid Instagram access token
     */
    PostInsights fetchPostInsights(String mediaId, String accessToken) throws GraphApiException;

    /**
     * Fetch profile info using the Business Discovery endpoint.
     *
     * @param profileUrl  Instagram profile URL
     * @param igUserId    The owning Instagram Business Account ID performing the lookup
     * @param accessToken Valid access token for that account
     */
    ProfileInfo fetchProfileInfo(String profileUrl, String igUserId, String accessToken) throws GraphApiException;

    /**
     * Validate an Instagram access token using the app credentials.
     */
    TokenValidation validateToken(String accessToken, String appId, String appSecret) throws GraphApiException;

    /**
     * Refresh a long-lived access token using the app credentials.
     */
    String refreshAccessToken(String currentToken, String appId, String appSecret) throws GraphApiException;

    /**
     * Resolve a media ID from an Instagram post shortcode.
     */
    String getMediaIdFromShortcode(String shortcode, String accessToken) throws GraphApiException;

    /**
     * Resolve the Instagram Business Account ID linked to the given access token.
     * Calls {@code /me/accounts?fields=instagram_business_account} and returns
     * the first linked IG Business Account ID.
     *
     * @param accessToken Valid Facebook/Instagram access token
     * @return Numeric Instagram Business Account ID (e.g. "17841460312302903")
     */
    String resolveIgUserId(String accessToken) throws GraphApiException;
}
