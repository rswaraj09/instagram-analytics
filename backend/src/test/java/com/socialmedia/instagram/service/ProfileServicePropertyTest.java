package com.socialmedia.instagram.service;

import com.socialmedia.instagram.entity.InstagramProfile;
import com.socialmedia.instagram.entity.User;
import com.socialmedia.instagram.repository.InstagramProfileRepository;
import net.jqwik.api.*;
import net.jqwik.api.lifecycle.BeforeTry;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for ProfileService
 * Tests Requirements 2.1, 2.2, 2.3
 * 
 * Property 6: Profile Creation Uniqueness
 * Property 7: Profile URL Validation
 * Property 8: Business Account Flag Consistency
 */
class ProfileServicePropertyTest {

    private InstagramProfileRepository profileRepository;
    private GraphApiService graphApiService;
    private ProfileService profileService;

    @BeforeTry
    void setup() {
        profileRepository = mock(InstagramProfileRepository.class);
        graphApiService = mock(GraphApiService.class);
        profileService = new ProfileService(profileRepository, graphApiService);
    }

    /**
     * Property 6: Profile Creation Uniqueness
     * 
     * **Validates: Requirements 2.1**
     * 
     * For any profile, if a profile with the same username already exists,
     * attempting to create another profile with that username SHALL fail with an error.
     * 
     * This ensures username uniqueness is enforced at the service layer.
     */
    @Property(tries = 100)
    @Label("Property 6: Profile Creation Uniqueness")
    void profileCreationUniquenessProperty(
            @ForAll("validUsername") String username,
            @ForAll("validProfileUrl") String profileUrl,
            @ForAll("user") User user) {
        
        // Arrange - Simulate that username already exists
        when(profileRepository.existsByUsername(username)).thenReturn(true);
        when(profileRepository.existsByProfileUrl(anyString())).thenReturn(false);

        // Act & Assert - Should throw exception for duplicate username
        assertThatThrownBy(() -> 
            profileService.addProfile(username, profileUrl, null, null, user)
        )
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("already exists");

        // Verify no profile was saved
        verify(profileRepository, never()).save(any(InstagramProfile.class));
    }

    /**
     * Property 7: Profile URL Validation
     * 
     * **Validates: Requirements 2.2, 16.1**
     * 
     * For any string, the profile URL validator SHALL accept only valid Instagram URLs
     * matching the pattern: https?://(www\.)?instagram\.com/[username]/?
     * 
     * Valid URLs:
     * - https://www.instagram.com/username/
     * - https://instagram.com/username
     * - http://www.instagram.com/username/
     * 
     * Invalid URLs:
     * - https://facebook.com/username
     * - https://www.instagram.com (missing username)
     * - instagram.com/username (missing protocol)
     * - https://www.instagram.com/user name/ (space in username)
     */
    @Property(tries = 100)
    @Label("Property 7: Profile URL Validation - Valid URLs")
    void profileUrlValidationValidProperty(@ForAll("validProfileUrl") String validUrl) {
        // Act
        boolean isValid = profileService.isValidProfileUrl(validUrl);

        // Assert - Valid URLs should be accepted
        assertThat(isValid)
            .as("Valid Instagram URL should be accepted: " + validUrl)
            .isTrue();
    }

    /**
     * Property 7b: Profile URL Validation - Invalid URLs
     */
    @Property(tries = 100)
    @Label("Property 7: Profile URL Validation - Invalid URLs")
    void profileUrlValidationInvalidProperty(@ForAll("invalidProfileUrl") String invalidUrl) {
        // Act
        boolean isValid = profileService.isValidProfileUrl(invalidUrl);

        // Assert - Invalid URLs should be rejected
        assertThat(isValid)
            .as("Invalid URL should be rejected: " + invalidUrl)
            .isFalse();
    }

    /**
     * Property 7c: Profile URL Validation - Rejection on Create
     */
    @Property(tries = 50)
    @Label("Property 7: Profile URL Validation - Reject Invalid on Create")
    void profileUrlValidationRejectsInvalidOnCreateProperty(
            @ForAll("validUsername") String username,
            @ForAll("invalidProfileUrl") String invalidUrl,
            @ForAll("user") User user) {
        
        // Arrange
        when(profileRepository.existsByUsername(anyString())).thenReturn(false);
        when(profileRepository.existsByProfileUrl(anyString())).thenReturn(false);

        // Act & Assert - Should throw exception for invalid URL
        assertThatThrownBy(() -> 
            profileService.addProfile(username, invalidUrl, null, null, user)
        )
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Invalid Instagram profile URL");

        // Verify no profile was saved
        verify(profileRepository, never()).save(any(InstagramProfile.class));
    }

    /**
     * Property 8: Business Account Flag Consistency
     * 
     * **Validates: Requirements 2.3**
     * 
     * For any profile:
     * - If a valid Graph API token is provided, isBusinessAccount SHALL be true
     * - If no token is provided (null or empty), isBusinessAccount SHALL be false
     * 
     * This ensures the business account flag accurately reflects token presence.
     */
    @Property(tries = 100)
    @Label("Property 8: Business Account Flag - With Valid Token")
    void businessAccountFlagWithTokenProperty(
            @ForAll("validUsername") String username,
            @ForAll("validProfileUrl") String profileUrl,
            @ForAll("validToken") String token,
            @ForAll("user") User user) throws Exception {
        
        // Arrange
        when(profileRepository.existsByUsername(anyString())).thenReturn(false);
        when(profileRepository.existsByProfileUrl(anyString())).thenReturn(false);
        
        when(profileRepository.save(any(InstagramProfile.class))).thenAnswer(invocation -> {
            InstagramProfile profile = invocation.getArgument(0);
            profile.setId(UUID.randomUUID());
            return profile;
        });

        // Act
        InstagramProfile profile = profileService.addProfile(username, profileUrl, null, token, user);

        // Assert - Profile with token should be marked as business account
        assertThat(profile.getIsBusinessAccount())
            .as("Profile with valid token should have isBusinessAccount=true")
            .isTrue();
        
        assertThat(profile.getGraphApiToken())
            .as("Profile should have token saved")
            .isEqualTo(token);
    }

    /**
     * Property 8b: Business Account Flag - Without Token
     */
    @Property(tries = 100)
    @Label("Property 8: Business Account Flag - Without Token")
    void businessAccountFlagWithoutTokenProperty(
            @ForAll("validUsername") String username,
            @ForAll("validProfileUrl") String profileUrl,
            @ForAll("user") User user) {
        
        // Arrange
        when(profileRepository.existsByUsername(anyString())).thenReturn(false);
        when(profileRepository.existsByProfileUrl(anyString())).thenReturn(false);
        
        when(profileRepository.save(any(InstagramProfile.class))).thenAnswer(invocation -> {
            InstagramProfile profile = invocation.getArgument(0);
            profile.setId(UUID.randomUUID());
            return profile;
        });

        // Act - Create profile without token (null)
        InstagramProfile profile = profileService.addProfile(username, profileUrl, null, null, user);

        // Assert - Profile without token should not be business account
        assertThat(profile.getIsBusinessAccount())
            .as("Profile without token should have isBusinessAccount=false")
            .isFalse();
        
        assertThat(profile.getGraphApiToken())
            .as("Profile should have no token")
            .isNull();
    }

    /**
     * Property 8c: Business Account Flag - Empty Token
     */
    @Property(tries = 50)
    @Label("Property 8: Business Account Flag - Empty Token")
    void businessAccountFlagWithEmptyTokenProperty(
            @ForAll("validUsername") String username,
            @ForAll("validProfileUrl") String profileUrl,
            @ForAll("user") User user) {
        
        // Arrange
        when(profileRepository.existsByUsername(anyString())).thenReturn(false);
        when(profileRepository.existsByProfileUrl(anyString())).thenReturn(false);
        
        when(profileRepository.save(any(InstagramProfile.class))).thenAnswer(invocation -> {
            InstagramProfile profile = invocation.getArgument(0);
            profile.setId(UUID.randomUUID());
            return profile;
        });

        // Act - Create profile with empty token string
        InstagramProfile profile = profileService.addProfile(username, profileUrl, null, "   ", user);

        // Assert - Profile with empty token should not be business account
        assertThat(profile.getIsBusinessAccount())
            .as("Profile with empty token should have isBusinessAccount=false")
            .isFalse();
        
        assertThat(profile.getGraphApiToken())
            .as("Profile should have no token (null, not empty string)")
            .isNull();
    }

    // ===== Arbitrary Generators =====

    /**
     * Generate valid Instagram usernames
     */
    @Provide
    Arbitrary<String> validUsername() {
        return Arbitraries.strings()
            .withCharRange('a', 'z')
            .numeric()
            .withChars('_', '.')
            .ofMinLength(1)
            .ofMaxLength(30)
            .filter(s -> !s.isEmpty() && Character.isLetterOrDigit(s.charAt(0)));
    }

    /**
     * Generate valid Instagram profile URLs
     */
    @Provide
    Arbitrary<String> validProfileUrl() {
        Arbitrary<String> protocol = Arbitraries.of("https://", "http://");
        Arbitrary<String> subdomain = Arbitraries.of("www.", "");
        Arbitrary<String> username = validUsername();
        Arbitrary<String> trailing = Arbitraries.of("/", "");

        return Combinators.combine(protocol, subdomain, username, trailing)
            .as((p, sub, user, trail) -> p + sub + "instagram.com/" + user + trail);
    }

    /**
     * Generate invalid Instagram profile URLs
     */
    @Provide
    Arbitrary<String> invalidProfileUrl() {
        return Arbitraries.oneOf(
            // Wrong domain
            Arbitraries.just("https://www.facebook.com/username/"),
            Arbitraries.just("https://twitter.com/username"),
            
            // Missing protocol
            validUsername().map(u -> "instagram.com/" + u),
            validUsername().map(u -> "www.instagram.com/" + u),
            
            // Missing username
            Arbitraries.just("https://www.instagram.com/"),
            Arbitraries.just("https://instagram.com"),
            
            // Invalid characters in username
            Arbitraries.strings().alpha().ofLength(5).map(s -> "https://www.instagram.com/" + s + " space/"),
            Arbitraries.strings().alpha().ofLength(5).map(s -> "https://www.instagram.com/" + s + "@invalid/"),
            
            // Completely invalid
            Arbitraries.just("not-a-url"),
            Arbitraries.just(""),
            Arbitraries.just("   ")
        );
    }

    /**
     * Generate valid Graph API tokens
     */
    @Provide
    Arbitrary<String> validToken() {
        return Arbitraries.strings()
            .alpha()
            .numeric()
            .ofMinLength(20)
            .ofMaxLength(100);
    }

    /**
     * Generate User entities
     */
    @Provide
    Arbitrary<User> user() {
        return Arbitraries.strings().alpha().ofMinLength(5).ofMaxLength(20).map(username -> {
            User user = new User();
            user.setId(UUID.randomUUID());
            user.setEmail(username + "@example.com");
            user.setFullName("Test User");
            return user;
        });
    }
}
