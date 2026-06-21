package com.socialmedia.instagram.service;

import com.socialmedia.instagram.dto.CreateInstagramAccountRequest;
import com.socialmedia.instagram.dto.InstagramAccountResponse;
import com.socialmedia.instagram.dto.UpdateInstagramAccountRequest;
import com.socialmedia.instagram.entity.InstagramAccount;
import com.socialmedia.instagram.entity.User;
import com.socialmedia.instagram.repository.InstagramAccountRepository;
import com.socialmedia.instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * CRUD + credential management for Instagram accounts (Issue 5).
 * Secrets are encrypted at rest and masked in responses.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InstagramAccountService {

    private final InstagramAccountRepository accountRepository;
    private final UserRepository userRepository;
    private final CredentialEncryptionService encryptionService;
    private final GraphApiService graphApiService;

    public InstagramAccountResponse createAccount(UUID userId, CreateInstagramAccountRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Auto-resolve IG Business Account ID from the access token if not provided
        String igUserId = req.igUserId();
        if (igUserId == null || igUserId.isBlank()) {
            try {
                igUserId = graphApiService.resolveIgUserId(req.accessToken());
                log.info("Auto-resolved IG Business Account ID: {}", igUserId);
            } catch (GraphApiException e) {
                throw new IllegalArgumentException(
                    "Could not resolve Instagram Business Account ID from the access token: " + e.getMessage());
            }
        }

        if (accountRepository.existsByUser_IdAndIgUserId(userId, igUserId)) {
            throw new IllegalArgumentException("An Instagram account with this IG user ID already exists");
        }
        InstagramAccount account = InstagramAccount.builder()
            .user(user)
            .accountName(req.accountName())
            .igUserId(igUserId)
            .appId(req.appId())
            .appSecret(encryptionService.encrypt(req.appSecret()))
            .accessToken(encryptionService.encrypt(req.accessToken()))
            .isActive(true)
            .tokenExpiresAt(req.tokenExpiresAt())
            .build();
        account = accountRepository.save(account);
        log.info("Created Instagram account {} for user {}", account.getId(), userId);
        return toResponse(account);
    }

    @Transactional(readOnly = true)
    public List<InstagramAccountResponse> listAccounts(UUID userId) {
        return accountRepository.findByUser_IdOrderByCreatedAtDesc(userId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public InstagramAccountResponse getAccount(UUID userId, UUID id) {
        return toResponse(getEntity(userId, id));
    }

    public InstagramAccountResponse updateAccount(UUID userId, UUID id, UpdateInstagramAccountRequest req) {
        InstagramAccount account = getEntity(userId, id);
        if (req.accountName() != null && !req.accountName().isBlank()) {
            account.setAccountName(req.accountName());
        }
        if (req.appId() != null && !req.appId().isBlank()) {
            account.setAppId(req.appId());
        }
        if (req.appSecret() != null && !req.appSecret().isBlank()) {
            account.setAppSecret(encryptionService.encrypt(req.appSecret()));
        }
        if (req.accessToken() != null && !req.accessToken().isBlank()) {
            account.setAccessToken(encryptionService.encrypt(req.accessToken()));
        }
        if (req.isActive() != null) {
            account.setIsActive(req.isActive());
        }
        if (req.tokenExpiresAt() != null) {
            account.setTokenExpiresAt(req.tokenExpiresAt());
        }
        account = accountRepository.save(account);
        return toResponse(account);
    }

    public void deleteAccount(UUID userId, UUID id) {
        InstagramAccount account = getEntity(userId, id);
        accountRepository.delete(account);
        log.info("Deleted Instagram account {} for user {}", id, userId);
    }

    @Transactional(readOnly = true)
    public InstagramAccount getEntity(UUID userId, UUID id) {
        return accountRepository.findByIdAndUser_Id(id, userId)
            .orElseThrow(() -> new IllegalArgumentException("Instagram account not found: " + id));
    }

    @Transactional(readOnly = true)
    public Optional<InstagramAccount> findFirstActive(UUID userId) {
        return accountRepository.findFirstByUser_IdAndIsActiveTrueOrderByCreatedAtAsc(userId);
    }

    /** Create an account during user registration (Issue 6). */
    public InstagramAccount createDuringRegistration(User user, String accountName, String igUserId,
                                                     String appId, String appSecret, String accessToken) {
        // Auto-resolve IG Business Account ID if not provided
        String resolvedIgUserId = igUserId;
        if (resolvedIgUserId == null || resolvedIgUserId.isBlank()) {
            try {
                resolvedIgUserId = graphApiService.resolveIgUserId(accessToken);
                log.info("Auto-resolved IG Business Account ID during registration: {}", resolvedIgUserId);
            } catch (GraphApiException e) {
                log.error("Failed to auto-resolve IG User ID during registration: {}", e.getMessage());
                throw new IllegalArgumentException(
                    "Could not resolve Instagram Business Account ID: " + e.getMessage());
            }
        }

        InstagramAccount account = InstagramAccount.builder()
            .user(user)
            .accountName(accountName != null && !accountName.isBlank() ? accountName : resolvedIgUserId)
            .igUserId(resolvedIgUserId)
            .appId(appId)
            .appSecret(encryptionService.encrypt(appSecret))
            .accessToken(encryptionService.encrypt(accessToken))
            .isActive(true)
            .build();
        return accountRepository.save(account);
    }

    /**
     * Resolve usable credentials for a user: the explicitly chosen account, or the
     * first active account when none is specified (Issue 7).
     */
    @Transactional(readOnly = true)
    public Optional<DecryptedCredentials> resolveCredentials(UUID userId, UUID accountId) {
        Optional<InstagramAccount> account = accountId != null
            ? accountRepository.findByIdAndUser_Id(accountId, userId)
            : findFirstActive(userId);
        return account.map(this::decrypt);
    }

    /** Decrypt the stored credentials for server-side Graph API use (Issue 7). */
    @Transactional(readOnly = true)
    public DecryptedCredentials decrypt(InstagramAccount account) {
        return new DecryptedCredentials(
            account.getIgUserId(),
            account.getAppId(),
            encryptionService.decrypt(account.getAppSecret()),
            encryptionService.decrypt(account.getAccessToken())
        );
    }

    /** Best-effort credential check used by the \"Test Credentials\" action (Issue 9). */
    @Transactional(readOnly = true)
    public boolean testCredentials(UUID userId, UUID id) {
        InstagramAccount account = getEntity(userId, id);
        try {
            DecryptedCredentials creds = decrypt(account);
            return creds.accessToken() != null && !creds.accessToken().isBlank()
                && creds.appSecret() != null && !creds.appSecret().isBlank();
        } catch (Exception e) {
            return false;
        }
    }

    private InstagramAccountResponse toResponse(InstagramAccount a) {
        String maskedSecret;
        String maskedToken;
        try {
            maskedSecret = encryptionService.mask(encryptionService.decrypt(a.getAppSecret()));
            maskedToken = encryptionService.mask(encryptionService.decrypt(a.getAccessToken()));
        } catch (Exception e) {
            maskedSecret = "\u2022\u2022\u2022\u2022";
            maskedToken = "\u2022\u2022\u2022\u2022";
        }
        return new InstagramAccountResponse(
            a.getId(),
            a.getAccountName(),
            a.getIgUserId(),
            a.getAppId(),
            maskedSecret,
            maskedToken,
            a.getIsActive(),
            a.getTokenExpiresAt(),
            a.getCreatedAt(),
            a.getUpdatedAt()
        );
    }

    /** Decrypted credentials for internal Graph API calls. */
    public record DecryptedCredentials(String igUserId, String appId, String appSecret, String accessToken) {}
}
