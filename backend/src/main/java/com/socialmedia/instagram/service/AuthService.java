package com.socialmedia.instagram.service;

import com.socialmedia.instagram.entity.InstagramAccount;
import com.socialmedia.instagram.entity.RefreshToken;
import com.socialmedia.instagram.entity.User;
import com.socialmedia.instagram.repository.RefreshTokenRepository;
import com.socialmedia.instagram.repository.UserRepository;
import com.socialmedia.instagram.security.JwtTokenProvider;
import com.socialmedia.instagram.security.TokenBlacklistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Authentication service: login, registration (optionally provisioning an
 * Instagram account), token refresh, and logout with access-token blacklisting.
 */
@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final InstagramAccountService instagramAccountService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            JwtTokenProvider jwtTokenProvider,
            InstagramAccountService instagramAccountService,
            TokenBlacklistService tokenBlacklistService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.instagramAccountService = instagramAccountService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    public AuthResponse login(String email, String password) {
        log.info("Login attempt for email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException("Invalid email or password"));
        if (!user.getIsActive()) {
            throw new AuthenticationException("Account is inactive");
        }
        if (!user.verifyPassword(password)) {
            throw new AuthenticationException("Invalid email or password");
        }
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());
        persistRefreshToken(user, refreshToken);
        log.info("Login successful for user: {}", user.getId());
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse register(String email, String password, String fullName, User.UserRole role,
                                 RegistrationInstagramCredentials creds) {
        log.info("Registration attempt for email: {}", email);
        if (userRepository.existsByEmail(email)) {
            throw new AuthenticationException("Email already registered");
        }
        User user = User.builder()
                .email(email)
                .fullName(fullName)
                .role(role)
                .isActive(true)
                .build();
        user.setPassword(password);
        user = userRepository.save(user);

        UUID instagramAccountId = null;
        if (creds != null && creds.accessToken() != null && !creds.accessToken().isBlank()) {
            try {
                InstagramAccount account = instagramAccountService.createDuringRegistration(
                        user,
                        creds.accountName(),
                        creds.igUserId(),
                        creds.appId(),
                        creds.appSecret(),
                        creds.accessToken()
                );
                instagramAccountId = account.getId();
            } catch (Exception e) {
                log.error("Failed to provision Instagram account during registration: {}", e.getMessage());
            }
        }

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());
        persistRefreshToken(user, refreshToken);
        log.info("Registration successful for user: {}", user.getId());
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .instagramAccountId(instagramAccountId)
                .build();
    }

    private void persistRefreshToken(User user, String refreshToken) {
        Instant expiresAt = jwtTokenProvider.getExpirationFromToken(refreshToken);
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .expiresAt(expiresAt)
                .build();
        refreshTokenRepository.save(refreshTokenEntity);
    }

    public RefreshResponse refreshAccessToken(String refreshTokenString) {
        log.info("Token refresh attempt");
        if (!jwtTokenProvider.validateToken(refreshTokenString)) {
            throw new AuthenticationException("Invalid refresh token");
        }
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                .orElseThrow(() -> new AuthenticationException("Refresh token not found"));
        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new AuthenticationException("Refresh token expired");
        }
        User user = refreshToken.getUser();
        if (!user.getIsActive()) {
            throw new AuthenticationException("Account is inactive");
        }
        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        log.info("Token refresh successful for user: {}", user.getId());
        return RefreshResponse.builder()
                .accessToken(newAccessToken)
                .build();
    }

    public void logout(String refreshTokenString, String accessTokenString) {
        log.info("Logout attempt");
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findByToken(refreshTokenString);
        if (refreshToken.isPresent()) {
            refreshTokenRepository.delete(refreshToken.get());
            log.info("Refresh token invalidated for user: {}", refreshToken.get().getUser().getId());
        } else {
            log.warn("Logout attempted with non-existent refresh token");
        }
        if (accessTokenString != null && !accessTokenString.isBlank()) {
            try {
                if (jwtTokenProvider.validateToken(accessTokenString)) {
                    String jti = jwtTokenProvider.getJtiFromToken(accessTokenString);
                    Instant expiresAt = jwtTokenProvider.getExpirationFromToken(accessTokenString);
                    tokenBlacklistService.blacklist(jti, expiresAt);
                    log.info("Access token blacklisted: {}", jti);
                }
            } catch (Exception e) {
                log.warn("Could not blacklist access token: {}", e.getMessage());
            }
        }
    }

    public void logoutAllSessions(UUID userId) {
        log.info("Logout all sessions for user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));
        refreshTokenRepository.deleteByUser(user);
        log.info("All sessions logged out for user: {}", userId);
    }

    public int cleanupExpiredTokens() {
        log.info("Cleaning up expired refresh tokens");
        int deletedCount = refreshTokenRepository.deleteExpiredTokens(Instant.now());
        log.info("Deleted {} expired refresh tokens", deletedCount);
        return deletedCount;
    }

    public static class AuthenticationException extends RuntimeException {
        public AuthenticationException(String message) {
            super(message);
        }
    }

    /** Optional Instagram credentials supplied at registration time (Issue 6). */
    public record RegistrationInstagramCredentials(
            String accountName, String igUserId, String appId, String appSecret, String accessToken) {}

    public static class AuthResponse {
        private final String accessToken;
        private final String refreshToken;
        private final UUID userId;
        private final String email;
        private final String fullName;
        private final String role;
        private final UUID instagramAccountId;

        private AuthResponse(Builder builder) {
            this.accessToken = builder.accessToken;
            this.refreshToken = builder.refreshToken;
            this.userId = builder.userId;
            this.email = builder.email;
            this.fullName = builder.fullName;
            this.role = builder.role;
            this.instagramAccountId = builder.instagramAccountId;
        }

        public static Builder builder() {
            return new Builder();
        }

        public String getAccessToken() { return accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public UUID getUserId() { return userId; }
        public String getEmail() { return email; }
        public String getFullName() { return fullName; }
        public String getRole() { return role; }
        public UUID getInstagramAccountId() { return instagramAccountId; }

        public static class Builder {
            private String accessToken;
            private String refreshToken;
            private UUID userId;
            private String email;
            private String fullName;
            private String role;
            private UUID instagramAccountId;

            public Builder accessToken(String accessToken) { this.accessToken = accessToken; return this; }
            public Builder refreshToken(String refreshToken) { this.refreshToken = refreshToken; return this; }
            public Builder userId(UUID userId) { this.userId = userId; return this; }
            public Builder email(String email) { this.email = email; return this; }
            public Builder fullName(String fullName) { this.fullName = fullName; return this; }
            public Builder role(String role) { this.role = role; return this; }
            public Builder instagramAccountId(UUID instagramAccountId) { this.instagramAccountId = instagramAccountId; return this; }
            public AuthResponse build() { return new AuthResponse(this); }
        }
    }

    public static class RefreshResponse {
        private final String accessToken;

        private RefreshResponse(Builder builder) {
            this.accessToken = builder.accessToken;
        }

        public static Builder builder() {
            return new Builder();
        }

        public String getAccessToken() { return accessToken; }

        public static class Builder {
            private String accessToken;
            public Builder accessToken(String accessToken) { this.accessToken = accessToken; return this; }
            public RefreshResponse build() { return new RefreshResponse(this); }
        }
    }
}
