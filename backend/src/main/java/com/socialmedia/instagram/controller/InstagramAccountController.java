package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.dto.*;
import com.socialmedia.instagram.service.InstagramAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for managing multi-Instagram account lifecycle, switching, combined analytics, and comparison.
 */
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Slf4j
public class InstagramAccountController {

    private final InstagramAccountService accountService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> create(@AuthenticationPrincipal UUID userId,
                                    @Valid @RequestBody CreateInstagramAccountRequest request) {
        try {
            InstagramAccountResponse response = accountService.createAccount(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<InstagramAccountResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(accountService.listAccounts(userId));
    }

    @GetMapping("/combined")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CombinedAnalyticsResponse> getCombinedAnalytics(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(accountService.getCombinedAnalytics(userId));
    }

    @GetMapping("/compare")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AccountComparisonResponse> compareAccounts(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) List<UUID> accountIds
    ) {
        return ResponseEntity.ok(accountService.compareAccounts(userId, accountIds));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> get(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        try {
            return ResponseEntity.ok(accountService.getAccount(userId, id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> update(@AuthenticationPrincipal UUID userId, @PathVariable UUID id,
                                    @Valid @RequestBody UpdateInstagramAccountRequest request) {
        try {
            return ResponseEntity.ok(accountService.updateAccount(userId, id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/disconnect")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> disconnect(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        try {
            return ResponseEntity.ok(accountService.disconnectAccount(userId, id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/label")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> renameLabel(@AuthenticationPrincipal UUID userId, @PathVariable UUID id,
                                         @RequestBody Map<String, String> body) {
        try {
            String newLabel = body.get("label");
            return ResponseEntity.ok(accountService.renameAccountLabel(userId, id, newLabel));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/set-default")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> setDefault(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        try {
            return ResponseEntity.ok(accountService.setDefaultAccount(userId, id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/sync")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> syncData(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        try {
            return ResponseEntity.ok(accountService.syncAccountData(userId, id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> delete(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        try {
            accountService.deleteAccount(userId, id);
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> test(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        try {
            boolean valid = accountService.testCredentials(userId, id);
            return ResponseEntity.ok(Map.of("valid", valid));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
