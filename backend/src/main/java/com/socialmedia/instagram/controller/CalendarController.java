package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.entity.ContentCalendarItem;
import com.socialmedia.instagram.repository.ContentCalendarRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
@Slf4j
public class CalendarController {

    private final ContentCalendarRepository calendarRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCalendarItems(@AuthenticationPrincipal UUID userId) {
        List<ContentCalendarItem> items = calendarRepository.findByUserIdOrderByScheduledDateAsc(userId);
        return ResponseEntity.ok(items);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createItem(
        @AuthenticationPrincipal UUID userId,
        @RequestBody CalendarItemRequest request
    ) {
        if (request.title() == null || request.title().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title is required."));
        }

        ContentCalendarItem item = ContentCalendarItem.builder()
            .userId(userId)
            .title(request.title())
            .caption(request.caption())
            .hashtags(request.hashtags())
            .mediaType(request.mediaType() != null ? request.mediaType() : "POST")
            .mediaUrl(request.mediaUrl())
            .scheduledDate(request.scheduledDate() != null ? request.scheduledDate() : Instant.now().plusSeconds(86400))
            .status(request.status() != null ? request.status() : "DRAFT")
            .build();

        ContentCalendarItem saved = calendarRepository.save(item);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/reschedule")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> rescheduleItem(
        @AuthenticationPrincipal UUID userId,
        @PathVariable UUID id,
        @RequestBody RescheduleRequest request
    ) {
        Optional<ContentCalendarItem> itemOpt = calendarRepository.findById(id);
        if (itemOpt.isPresent() && itemOpt.get().getUserId().equals(userId)) {
            ContentCalendarItem item = itemOpt.get();
            item.setScheduledDate(request.newDate());
            if (request.status() != null) item.setStatus(request.status());
            ContentCalendarItem updated = calendarRepository.save(item);
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Item not found or access denied."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteItem(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        Optional<ContentCalendarItem> itemOpt = calendarRepository.findById(id);
        if (itemOpt.isPresent() && itemOpt.get().getUserId().equals(userId)) {
            calendarRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Calendar item deleted."));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Item not found or access denied."));
    }

    public record CalendarItemRequest(
        String title,
        String caption,
        String hashtags,
        String mediaType,
        String mediaUrl,
        Instant scheduledDate,
        String status
    ) {}

    public record RescheduleRequest(Instant newDate, String status) {}
}
