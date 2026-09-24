package com.socialmedia.instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = true)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String objective;

    private String brand;

    private String category;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Builder.Default
    private Double budget = 0.0;

    @Column(name = "total_spend")
    @Builder.Default
    private Double totalSpend = 0.0;

    @Builder.Default
    private Double revenue = 0.0;

    @Column(length = 50)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, ACTIVE, COMPLETED, PAUSED

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "campaign_accounts",
        joinColumns = @JoinColumn(name = "campaign_id"),
        inverseJoinColumns = @JoinColumn(name = "account_id")
    )
    @Builder.Default
    private Set<InstagramAccount> campaignAccounts = new HashSet<>();

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (status == null) status = "DRAFT";
        if (budget == null) budget = 0.0;
        if (totalSpend == null) totalSpend = 0.0;
        if (revenue == null) revenue = 0.0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
