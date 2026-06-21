package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.dto.ProfileInfo;
import com.socialmedia.instagram.entity.InstagramProfile;
import com.socialmedia.instagram.entity.User;
import com.socialmedia.instagram.repository.UserRepository;
import com.socialmedia.instagram.service.GraphApiException;
import com.socialmedia.instagram.service.GraphApiService;
import com.socialmedia.instagram.service.InstagramAccountService;
import com.socialmedia.instagram.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * REST Controller for Instagram profile management.
 */
@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;
    private final GraphApiService graphApiService;
    private final InstagramAccountService accountService;

    @PostMapping("/fetch-by-url")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> fetchProfileByUrl(@AuthenticationPrincipal UUID userId,
                                               @RequestBody FetchProfileRequest request) {
        String profileUrl = request.profileUrl();
        log.info("Fetching profile by URL: {}", profileUrl);
        if (!profileService.isValidProfileUrl(profileUrl)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid Instagram profile URL"));
        }
        Optional<InstagramAccountService.DecryptedCredentials> creds =
            accountService.resolveCredentials(userId, request.accountId());
        if (creds.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "Failed to fetch profile data from Instagram API",
                "details", "No Instagram account configured. Add one under Accounts."
            ));
        }
        try {
            ProfileInfo info = graphApiService.fetchProfileInfo(
                profileUrl, creds.get().igUserId(), creds.get().accessToken());
            return ResponseEntity.ok(info);
        } catch (GraphApiException e) {
            log.error("Graph API error while fetching profile {}: {}", profileUrl, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "Failed to fetch profile data from Instagram API",
                "details", e.getMessage()
            ));
        }
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<InstagramProfile>> listProfiles(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size
    ) {
        log.info("Listing profiles, page={}, size={}", page, size);
        return ResponseEntity.ok(profileService.getAllProfiles(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getProfile(@PathVariable UUID id) {
        log.info("Getting profile: {}", id);
        return profileService.getProfile(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> createProfile(
        @RequestBody CreateProfileRequest request,
        @AuthenticationPrincipal UUID userId
    ) {
        log.info("Creating profile for username: {}", request.username());
        try {
            User addedBy = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + userId));
            InstagramProfile profile = profileService.addProfile(
                request.username(),
                request.profileUrl(),
                request.category(),
                request.graphApiToken(),
                addedBy
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to create profile: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create profile: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateProfile(
        @PathVariable UUID id,
        @RequestBody UpdateProfileRequest request
    ) {
        log.info("Updating profile: {}", id);
        try {
            InstagramProfile profile = profileService.updateProfile(
                id,
                request.category(),
                request.graphApiToken()
            );
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to update profile: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteProfile(@PathVariable UUID id) {
        log.info("Deleting profile: {}", id);
        try {
            profileService.deleteProfile(id);
            return ResponseEntity.ok(Map.of("message", "Profile deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to delete profile: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete profile: " + e.getMessage()));
        }
    }

    public record CreateProfileRequest(
        String username,
        String profileUrl,
        String category,
        String graphApiToken
    ) {}

    public record UpdateProfileRequest(
        String category,
        String graphApiToken
    ) {}

    public record FetchProfileRequest(String profileUrl, UUID accountId) {}
}
