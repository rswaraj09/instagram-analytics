package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.entity.User;
import com.socialmedia.instagram.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for authentication endpoints.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthService.AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthResponse response = authService.login(request.email(), request.password());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthService.AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User.UserRole role = parseRole(request.role());
        AuthService.RegistrationInstagramCredentials creds = null;
        if (request.accessToken() != null && !request.accessToken().isBlank()
                && request.appSecret() != null && !request.appSecret().isBlank()) {
            creds = new AuthService.RegistrationInstagramCredentials(
                    request.accountName(),
                    request.igUserId(),
                    request.appId(),
                    request.appSecret(),
                    request.accessToken()
            );
        }
        AuthService.AuthResponse response = authService.register(
                request.email(),
                request.password(),
                request.fullName(),
                role,
                creds
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private User.UserRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            return User.UserRole.VIEWER;
        }
        try {
            return User.UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return User.UserRole.VIEWER;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthService.RefreshResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        AuthService.RefreshResponse response = authService.refreshAccessToken(request.refreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request,
                                       @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String accessToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            accessToken = authHeader.substring("Bearer ".length());
        }
        authService.logout(request.refreshToken(), accessToken);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/google")
    public void googleLogin() {
    }

    @GetMapping("/google/callback")
    public void googleCallback() {
    }

    @GetMapping("/google/failure")
    public ResponseEntity<ErrorResponse> googleFailure() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("OAuth2 authentication failed"));
    }

    @ExceptionHandler(AuthService.AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthService.AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(ex.getMessage()));
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8) String password
    ) {}

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8) String password,
            @NotBlank String fullName,
            String role,
            String accountName,
            String igUserId,
            String appId,
            String appSecret,
            String accessToken
    ) {}

    public record RefreshRequest(
            @NotBlank String refreshToken
    ) {}

    public record LogoutRequest(
            @NotBlank String refreshToken
    ) {}

    public record ErrorResponse(String message) {}
}
