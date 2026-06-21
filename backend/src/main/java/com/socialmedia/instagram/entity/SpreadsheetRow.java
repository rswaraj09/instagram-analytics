package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a single row in a user's spreadsheet dashboard.
 * Rows are persisted so they survive logout/login cycles.
 */
@Entity
@Table(name = "spreadsheet_rows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpreadsheetRow {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "row_order", nullable = false)
    @Builder.Default
    private Integer rowOrder = 0;

    @Column(name = "profile_url", length = 500)
    private String profileUrl;

    @Column(name = "username")
    private String username;

    @Column(name = "post_url", length = 500)
    private String postUrl;

    @Column(name = "followers_count")
    private Long followersCount;

    @Column(name = "following_count")
    private Long followingCount;

    @Column(name = "total_posts")
    private Integer totalPosts;

    @Column(name = "likes_count")
    private Long likesCount;

    @Column(name = "comments_count")
    private Long commentsCount;

    @Column(name = "views_count")
    private Long viewsCount;

    @Column(name = "reach")
    private Long reach;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
