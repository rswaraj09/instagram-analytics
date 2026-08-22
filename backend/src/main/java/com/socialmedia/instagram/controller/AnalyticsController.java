package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.dto.DashboardSummary;
import com.socialmedia.instagram.dto.MediaItem;
import com.socialmedia.instagram.service.AnalyticsService;
import com.socialmedia.instagram.service.ContentSyncService;
import com.socialmedia.instagram.service.GraphApiException;
import com.socialmedia.instagram.service.InstagramAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.*;

/**
 * REST Controller for the new Reel & Post Analytics Dashboard (issues.md).
 * All endpoints require authentication.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final ContentSyncService contentSyncService;
    private final AnalyticsService   analyticsService;
    private final InstagramAccountService accountService;

    /**
     * Sync all media from the connected Instagram account and return full list.
     * Supports optional accountId, limit, and filtering/sorting.
     */
    @GetMapping("/media")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllMedia(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) UUID accountId,
        @RequestParam(defaultValue = "100") int limit,
        @RequestParam(required = false) String type,         // IMAGE|VIDEO|REELS
        @RequestParam(required = false) String search,       // caption/hashtag/id search
        @RequestParam(required = false) String sortBy,       // views|likes|comments|shares|saves|engagement|newest|oldest
        @RequestParam(required = false) String dateFrom,     // ISO date
        @RequestParam(required = false) String dateTo,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Optional<InstagramAccountService.DecryptedCredentials> creds =
            accountService.resolveCredentials(userId, accountId);

        if (creds.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "No Instagram account configured. Please add one under Accounts."
            ));
        }

        try {
            InstagramAccountService.DecryptedCredentials c = creds.get();
            List<MediaItem> items = contentSyncService.syncAllMedia(c.igUserId(), c.accessToken(), limit);

            // Filter by type
            if (type != null && !type.isBlank()) {
                String tf = type.toUpperCase();
                items = items.stream()
                    .filter(m -> tf.equals("REELS")
                        ? "REELS".equalsIgnoreCase(m.getMediaProductType())
                        : tf.equalsIgnoreCase(m.getMediaType()))
                    .toList();
            }

            // Filter by date range
            if (dateFrom != null || dateTo != null) {
                items = filterByDate(items, dateFrom, dateTo);
            }

            // Search
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase();
                items = items.stream()
                    .filter(m ->
                        (m.getCaption() != null && m.getCaption().toLowerCase().contains(q)) ||
                        (m.getId() != null && m.getId().toLowerCase().contains(q)) ||
                        (m.getShortcode() != null && m.getShortcode().toLowerCase().contains(q)) ||
                        (m.getTimestamp() != null && m.getTimestamp().toString().contains(q))
                    )
                    .toList();
            }

            // Sort
            items = sort(items, sortBy);

            // Paginate
            int total = items.size();
            int fromIdx = Math.min(page * size, total);
            int toIdx = Math.min(fromIdx + size, total);
            List<MediaItem> paged = items.subList(fromIdx, toIdx);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("content", paged);
            response.put("totalElements", total);
            response.put("totalPages", (int) Math.ceil((double) total / size));
            response.put("page", page);
            response.put("size", size);
            return ResponseEntity.ok(response);

        } catch (GraphApiException e) {
            log.error("Graph API error fetching media: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "Failed to fetch media from Instagram API",
                "details", e.getMessage()
            ));
        }
    }

    /**
     * Returns the full dashboard summary (totals + best performers + daily snapshots).
     */
    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDashboardSummary(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) UUID accountId,
        @RequestParam(defaultValue = "200") int limit
    ) {
        Optional<InstagramAccountService.DecryptedCredentials> creds =
            accountService.resolveCredentials(userId, accountId);

        if (creds.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "No Instagram account configured."
            ));
        }

        try {
            InstagramAccountService.DecryptedCredentials c = creds.get();
            List<MediaItem> items = contentSyncService.syncAllMedia(c.igUserId(), c.accessToken(), limit);
            DashboardSummary summary = analyticsService.buildSummary(items);
            return ResponseEntity.ok(summary);
        } catch (GraphApiException e) {
            log.error("Error building dashboard summary: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "Failed to build dashboard summary",
                "details", e.getMessage()
            ));
        }
    }

    /**
     * Compare multiple media items side-by-side by their IDs.
     */
    @PostMapping("/compare")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> compareMedia(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) UUID accountId,
        @RequestBody CompareRequest request
    ) {
        if (request.ids() == null || request.ids().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No media IDs provided"));
        }

        Optional<InstagramAccountService.DecryptedCredentials> creds =
            accountService.resolveCredentials(userId, accountId);

        if (creds.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "No Instagram account configured."
            ));
        }

        try {
            InstagramAccountService.DecryptedCredentials c = creds.get();
            List<MediaItem> all = contentSyncService.syncAllMedia(c.igUserId(), c.accessToken(), 500);
            Set<String> idSet = new HashSet<>(request.ids());
            List<MediaItem> compared = all.stream()
                .filter(m -> idSet.contains(m.getId()))
                .toList();
            return ResponseEntity.ok(compared);
        } catch (GraphApiException e) {
            log.error("Error comparing media: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "Failed to compare media",
                "details", e.getMessage()
            ));
        }
    }

    /**
     * Export media analytics as CSV.
     */
    @GetMapping("/export/csv")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> exportCsv(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) UUID accountId,
        @RequestParam(defaultValue = "500") int limit
    ) {
        Optional<InstagramAccountService.DecryptedCredentials> creds =
            accountService.resolveCredentials(userId, accountId);

        if (creds.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }

        try {
            InstagramAccountService.DecryptedCredentials c = creds.get();
            List<MediaItem> items = contentSyncService.syncAllMedia(c.igUserId(), c.accessToken(), limit);
            byte[] csv = buildCsv(items);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "instagram-analytics.csv");
            return ResponseEntity.ok().headers(headers).body(csv);

        } catch (GraphApiException e) {
            log.error("Error exporting CSV: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private byte[] buildCsv(List<MediaItem> items) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        pw.println("ID,Shortcode,Type,ProductType,Caption,Permalink,PublishedAt," +
            "Likes,Comments,Views,Reach,Impressions,Saves,Shares,ProfileVisits," +
            "Follows,Clicks,AvgWatchTimeSec,EngagementRate");
        for (MediaItem m : items) {
            pw.printf("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s%n",
                csv(m.getId()), csv(m.getShortcode()), csv(m.getMediaType()),
                csv(m.getMediaProductType()), csvText(m.getCaption()),
                csv(m.getPermalink()), m.getTimestamp() != null ? m.getTimestamp() : "",
                m.getLikeCount(), m.getCommentsCount(), safeL(m.getVideoViews()),
                safeL(m.getReach()), safeL(m.getImpressions()), safeL(m.getSaved()),
                safeL(m.getShares()), safeL(m.getProfileVisits()),
                safeL(m.getFollows()), safeL(m.getClicks()),
                m.getAvgWatchTime() != null ? m.getAvgWatchTime() / 1000 : 0,
                m.getEngagementRate() != null ? m.getEngagementRate() : 0.0
            );
        }
        return sw.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String csv(String s) { return s != null ? "\"" + s.replace("\"", "\"\"") + "\"" : ""; }
    private String csvText(String s) {
        if (s == null) return "";
        String clean = s.replace("\n", " ").replace("\r", " ");
        return "\"" + clean.replace("\"", "\"\"") + "\"";
    }
    private long safeL(Long v) { return v != null ? v : 0L; }

    private List<MediaItem> filterByDate(List<MediaItem> items, String from, String to) {
        return items.stream().filter(m -> {
            if (m.getTimestamp() == null) return true;
            if (from != null) {
                try {
                    if (m.getTimestamp().isBefore(java.time.Instant.parse(from + "T00:00:00Z"))) return false;
                } catch (Exception ignored) {}
            }
            if (to != null) {
                try {
                    if (m.getTimestamp().isAfter(java.time.Instant.parse(to + "T23:59:59Z"))) return false;
                } catch (Exception ignored) {}
            }
            return true;
        }).toList();
    }

    private List<MediaItem> sort(List<MediaItem> items, String sortBy) {
        if (sortBy == null || sortBy.isBlank()) return items;
        Comparator<MediaItem> cmp = switch (sortBy.toLowerCase()) {
            case "likes"      -> Comparator.comparingLong(m -> -safeL(m.getLikeCount()));
            case "comments"   -> Comparator.comparingLong(m -> -safeL(m.getCommentsCount()));
            case "views"      -> Comparator.comparingLong(m -> -safeL(m.getVideoViews()));
            case "shares"     -> Comparator.comparingLong(m -> -safeL(m.getShares()));
            case "saves"      -> Comparator.comparingLong(m -> -safeL(m.getSaved()));
            case "reach"      -> Comparator.comparingLong(m -> -safeL(m.getReach()));
            case "impressions"-> Comparator.comparingLong(m -> -safeL(m.getImpressions()));
            case "engagement" -> Comparator.comparingDouble(m -> -(m.getEngagementRate() != null ? m.getEngagementRate() : 0.0));
            case "oldest"     -> Comparator.comparing(m -> m.getTimestamp() != null ? m.getTimestamp() : java.time.Instant.MIN);
            default           -> Comparator.comparing(m -> m.getTimestamp() != null ? m.getTimestamp() : java.time.Instant.MIN, Comparator.reverseOrder()); // "newest"
        };
        List<MediaItem> mutable = new ArrayList<>(items);
        mutable.sort(cmp);
        return mutable;
    }

    public record CompareRequest(List<String> ids) {}
}
