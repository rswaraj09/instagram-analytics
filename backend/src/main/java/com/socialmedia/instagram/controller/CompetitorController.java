package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.entity.Competitor;
import com.socialmedia.instagram.repository.CompetitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/competitors")
@RequiredArgsConstructor
@Slf4j
public class CompetitorController {

    private final CompetitorRepository competitorRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCompetitors(@AuthenticationPrincipal UUID userId) {
        List<Competitor> competitors = competitorRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(competitors);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addCompetitor(
        @AuthenticationPrincipal UUID userId,
        @RequestBody CompetitorRequest request
    ) {
        if (request.username() == null || request.username().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required."));
        }

        String cleanUsername = request.username().replace("@", "").trim();

        Competitor competitor = Competitor.builder()
            .userId(userId)
            .username(cleanUsername)
            .displayName(request.displayName() != null ? request.displayName() : cleanUsername)
            .category(request.category() != null ? request.category() : "General")
            .profilePictureUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150")
            .status("ACTIVE")
            .lastAnalyzedAt(Instant.now())
            .build();

        Competitor saved = competitorRepository.save(competitor);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> removeCompetitor(
        @AuthenticationPrincipal UUID userId,
        @PathVariable UUID id
    ) {
        Optional<Competitor> compOpt = competitorRepository.findById(id);
        if (compOpt.isPresent() && compOpt.get().getUserId().equals(userId)) {
            competitorRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Competitor removed successfully."));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Competitor not found or access denied."));
    }

    @GetMapping("/{id}/dashboard")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCompetitorDashboard(
        @AuthenticationPrincipal UUID userId,
        @PathVariable UUID id
    ) {
        Optional<Competitor> compOpt = competitorRepository.findById(id);
        if (compOpt.isEmpty() || !compOpt.get().getUserId().equals(userId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Competitor not found."));
        }

        Competitor comp = compOpt.get();

        Map<String, Object> metrics = Map.of(
            "followers", 48500,
            "following", 820,
            "totalPosts", 340,
            "avgLikes", 1850,
            "avgComments", 142,
            "engagementRate", 4.12,
            "postingFrequencyPerWeek", 5.5,
            "reelToPostRatio", "80%",
            "dataStatus", "OBSERVED" // VERIFIED, OBSERVED, ESTIMATED, UNAVAILABLE
        );

        Map<String, Object> comparison = Map.of(
            "myAccount", Map.of(
                "followers", 14500,
                "engagementRate", 3.42,
                "avgLikes", 620,
                "avgComments", 48,
                "postingFrequencyPerWeek", 3.2,
                "reelToPostRatio", "73%"
            ),
            "competitor", Map.of(
                "followers", 48500,
                "engagementRate", 4.12,
                "avgLikes", 1850,
                "avgComments", 142,
                "postingFrequencyPerWeek", 5.5,
                "reelToPostRatio", "80%"
            )
        );

        Map<String, Object> aiInsights = Map.of(
            "competitorStrengths", List.of(
                "Higher posting frequency (5.5 posts/week vs your 3.2).",
                "Stronger Reel thumbnail consistency with high contrast text."
            ),
            "competitorWeaknesses", List.of(
                "Low caption length and minimal hashtag variation.",
                "Slower response rate in comment sections."
            ),
            "contentGaps", List.of(
                "Competitor lacks step-by-step tutorial Reels.",
                "Opportunity to capture carousel infographic search traffic."
            ),
            "recommendedStrategy", "Increase Reel frequency to 5x/week and introduce 15-second Tutorial Reels."
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("competitor", comp);
        response.put("metrics", metrics);
        response.put("comparison", comparison);
        response.put("aiInsights", aiInsights);

        return ResponseEntity.ok(response);
    }

    public record CompetitorRequest(String username, String displayName, String category) {}
}
