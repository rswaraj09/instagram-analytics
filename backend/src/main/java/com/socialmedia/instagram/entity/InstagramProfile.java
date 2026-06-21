package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing an Instagram profile being monitored
 */
@Entity
@Table(name = "instagram_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstagramProfile {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String profileUrl;

    private String category;

    private Long followersCount;

    private Long followingCount;

    private Integer totalPosts;

    private String profilePictureUrl;

    private Boolean isBusinessAccount;

    @Column(length = 1000)
    private String graphApiToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by")
    @JsonIgnore
    private User addedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instagram_account_id")
    @JsonIgnore
    private InstagramAccount instagramAccount;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
