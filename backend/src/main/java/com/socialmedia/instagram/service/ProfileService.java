package com.socialmedia.instagram.service;

import com.socialmedia.instagram.entity.InstagramProfile;
import com.socialmedia.instagram.entity.User;
import com.socialmedia.instagram.repository.InstagramProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Service for managing Instagram profiles
 * Implements Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProfileService {

    private final InstagramProfileRepository profileRepository;
    private final GraphApiService graphApiService;

    // Instagram profile URL pattern: https://www.instagram.com/username/ or https://instagram.com/username
    private static final Pattern PROFILE_URL_PATTERN = Pattern.compile(
        "^https?://(www\\.)?instagram\\.com/([a-zA-Z0-9._]+)/?$"
    );

    /**
     * Add new Instagram profile
     * Implements Requirement 2.1, 2.2, 2.3, 2.4
     *
     * @param username Instagram username
     * @param profileUrl Instagram profile URL
     * @param category Optional profile category
     * @param graphApiToken Optional Graph API token for business accounts
     * @param addedBy User who added the profile
     * @return Created profile
     * @throws IllegalArgumentException if validation fails
     */
    public InstagramProfile addProfile(String username, String profileUrl, String category,
                                      String graphApiToken, User addedBy) {
        log.info("Adding new profile: username={}, url={}", username, profileUrl);

        // Validate profile URL (Requirement 2.2)
        if (!isValidProfileUrl(profileUrl)) {
            throw new IllegalArgumentException(
                "Invalid Instagram profile URL. Expected format: https://www.instagram.com/username/"
            );
        }

        // Check username uniqueness (Requirement 2.1)
        if (profileRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Profile with username '" + username + "' already exists");
        }

        // Check URL uniqueness
        if (profileRepository.existsByProfileUrl(profileUrl)) {
            throw new IllegalArgumentException("Profile with URL '" + profileUrl + "' already exists");
        }

        // A raw per-profile Graph API token is a legacy fallback. Full Graph API
        // validation now requires linked app credentials (Issue 5/7), so here we
        // only record whether a token was supplied.
        boolean isBusinessAccount = graphApiToken != null && !graphApiToken.trim().isEmpty();
        if (isBusinessAccount) {
            log.info("Profile {} configured with a Graph API token", username);
        }

        // Set isBusinessAccount flag based on token presence (Requirement 2.3)
        InstagramProfile profile = InstagramProfile.builder()
            .username(username)
            .profileUrl(profileUrl)
            .category(category)
            .isBusinessAccount(isBusinessAccount)
            .graphApiToken(graphApiToken != null && !graphApiToken.trim().isEmpty() ? graphApiToken : null)
            .addedBy(addedBy)
            .build();

        profile = profileRepository.save(profile);
        log.info("Profile created successfully: id={}, username={}, isBusinessAccount={}", 
            profile.getId(), profile.getUsername(), profile.getIsBusinessAccount());

        return profile;
    }

    /**
     * Validate Instagram profile URL format
     * Implements Requirement 2.2, 16.1
     *
     * @param profileUrl URL to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidProfileUrl(String profileUrl) {
        if (profileUrl == null || profileUrl.trim().isEmpty()) {
            return false;
        }
        return PROFILE_URL_PATTERN.matcher(profileUrl.trim()).matches();
    }

    /**
     * Extract username from profile URL
     *
     * @param profileUrl Profile URL
     * @return Username, or null if URL is invalid
     */
    public String extractUsernameFromUrl(String profileUrl) {
        if (profileUrl == null) {
            return null;
        }
        var matcher = PROFILE_URL_PATTERN.matcher(profileUrl.trim());
        if (matcher.matches()) {
            return matcher.group(2);
        }
        return null;
    }

    /**
     * Get profile by ID
     * Implements Requirement 2.5
     *
     * @param id Profile ID
     * @return Profile if found
     */
    @Transactional(readOnly = true)
    public Optional<InstagramProfile> getProfile(UUID id) {
        return profileRepository.findById(id);
    }

    /**
     * Get profile by username
     *
     * @param username Username
     * @return Profile if found
     */
    @Transactional(readOnly = true)
    public Optional<InstagramProfile> getProfileByUsername(String username) {
        return profileRepository.findByUsername(username);
    }

    /**
     * Get all profiles with pagination
     * Implements Requirement 2.5
     *
     * @param pageable Pagination info
     * @return Page of profiles
     */
    @Transactional(readOnly = true)
    public Page<InstagramProfile> getAllProfiles(Pageable pageable) {
        return profileRepository.findAll(pageable);
    }

    /**
     * Update profile
     * Implements Requirement 2.6
     *
     * @param id Profile ID
     * @param category New category (optional)
     * @param graphApiToken New Graph API token (optional)
     * @return Updated profile
     * @throws IllegalArgumentException if profile not found or validation fails
     */
    public InstagramProfile updateProfile(UUID id, String category, String graphApiToken) {
        log.info("Updating profile: id={}", id);

        InstagramProfile profile = profileRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + id));

        // Update category if provided
        if (category != null) {
            profile.setCategory(category);
        }

        // Update Graph API token if provided (validation requires linked app credentials)
        if (graphApiToken != null && !graphApiToken.trim().isEmpty()) {
            profile.setGraphApiToken(graphApiToken);
            profile.setIsBusinessAccount(true);
            log.info("Profile {} updated with a new Graph API token", profile.getUsername());
        } else if (graphApiToken != null && graphApiToken.trim().isEmpty()) {
            // Empty string means remove token
            profile.setGraphApiToken(null);
            profile.setIsBusinessAccount(false);
            log.info("Profile {} token removed, marked as non-business", profile.getUsername());
        }

        profile = profileRepository.save(profile);
        log.info("Profile updated successfully: id={}", profile.getId());

        return profile;
    }

    /**
     * Delete profile
     * Implements Requirement 2.7
     * Note: Cascade deletion of posts and metrics is handled by JPA @OnDelete annotation
     *
     * @param id Profile ID
     * @throws IllegalArgumentException if profile not found
     */
    public void deleteProfile(UUID id) {
        log.info("Deleting profile: id={}", id);

        if (!profileRepository.existsById(id)) {
            throw new IllegalArgumentException("Profile not found: " + id);
        }

        profileRepository.deleteById(id);
        log.info("Profile deleted successfully: id={}", id);
    }

    /**
     * Update profile metrics (followers, following, total posts)
     *
     * @param id Profile ID
     * @param followersCount Followers count
     * @param followingCount Following count
     * @param totalPosts Total posts count
     * @param profilePictureUrl Profile picture URL
     * @return Updated profile
     */
    public InstagramProfile updateProfileMetrics(UUID id, Long followersCount, Long followingCount,
                                                 Integer totalPosts, String profilePictureUrl) {
        InstagramProfile profile = profileRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + id));

        profile.setFollowersCount(followersCount);
        profile.setFollowingCount(followingCount);
        profile.setTotalPosts(totalPosts);
        profile.setProfilePictureUrl(profilePictureUrl);

        return profileRepository.save(profile);
    }
}
