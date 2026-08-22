package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "content_calendar")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentCalendarItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_id")
    private UUID accountId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(length = 500)
    private String hashtags;

    @Column(name = "media_type", length = 50)
    private String mediaType; // POST, REEL, STORY

    @Column(name = "media_url", columnDefinition = "TEXT")
    private String mediaUrl;

    @Column(name = "scheduled_date", nullable = false)
    private Instant scheduledDate;

    @Column(length = 50)
    private String status; // DRAFT, SCHEDULED, PUBLISHED

    @Column(name = "performance_notes", columnDefinition = "TEXT")
    private String performanceNotes;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = "DRAFT";
        if (mediaType == null) mediaType = "POST";
    }
}
