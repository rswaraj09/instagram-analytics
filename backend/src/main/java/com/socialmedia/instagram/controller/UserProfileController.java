package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.entity.User;
import com.socialmedia.instagram.repository.InstagramAccountRepository;
import com.socialmedia.instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
@Slf4j
public class UserProfileController {

    private final UserRepository userRepository;
    private final InstagramAccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UUID userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found."));
        }

        User user = userOpt.get();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("role", user.getRole());
        response.put("twoFactorEnabled", false);
        response.put("connectedAccountsCount", accountRepository.findByUserId(userId).size());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/security")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateSecuritySettings(
        @AuthenticationPrincipal UUID userId,
        @RequestBody SecurityUpdateRequest request
    ) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found."));
        }

        User user = userOpt.get();
        if (request.newPassword() != null && !request.newPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of(
            "message", "Security settings updated successfully.",
            "twoFactorEnabled", request.enable2FA() != null ? request.enable2FA() : false
        ));
    }

    @DeleteMapping("/delete-account")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteAccountAndData(@AuthenticationPrincipal UUID userId) {
        log.warn("Account and all associated Instagram analytics data requested for deletion for user: {}", userId);
        userRepository.deleteById(userId);
        return ResponseEntity.ok(Map.of("message", "User account and all personal/Instagram data permanently deleted."));
    }

    public record SecurityUpdateRequest(String currentPassword, String newPassword, Boolean enable2FA) {}
}
