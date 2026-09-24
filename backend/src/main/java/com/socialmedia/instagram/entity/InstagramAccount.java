package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.Instant;
import java.util.UUID;

/**
 * An Instagram (Graph API) account owned by a user. App secret and access token
 * are stored encrypted (AES-256-GCM). Supports multi-account management.
 */
@Entity
@Table(name = "instagram_accounts",
       uniqueConstraints = @UniqueConstraint(name = "uk_account_user_iguser", columnNames = {"user_id", "ig_user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstagramAccount {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "account_name", nullable = false)
    private String accountName;

    @Column(name = "username")
    private String username;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "profile_picture", length = 1000)
    private String profilePicture;

    @Column(name = "account_type")
    @Builder.Default
    private String accountType = "BUSINESS";

    @Column(name = "ig_user_id", nullable = false)
    private String igUserId;

    @Column(name = "app_id", nullable = false)
    private String appId;

    @Column(name = "app_secret", nullable = false, length = 1000)
    private String appSecret;

    @Column(name = "access_token", nullable = false, length = 2000)
    private String accessToken;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_status", nullable = false)
    @Builder.Default
    private ConnectionStatus connectionStatus = ConnectionStatus.CONNECTED;

    @Column(name = "token_expires_at")
    private Instant tokenExpiresAt;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @Column(name = "last_successful_sync")
    private Instant lastSuccessfulSync;

    @Column(name = "last_failed_sync")
    private Instant lastFailedSync;

    @Column(name = "sync_error_message", length = 2000)
    private String syncErrorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum ConnectionStatus {
        CONNECTED,
        DISCONNECTED,
        ERROR,
        SYNCING
    }
}
