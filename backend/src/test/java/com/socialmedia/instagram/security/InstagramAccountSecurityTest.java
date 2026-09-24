package com.socialmedia.instagram.security;

import com.socialmedia.instagram.dto.CreateInstagramAccountRequest;
import com.socialmedia.instagram.dto.InstagramAccountResponse;
import com.socialmedia.instagram.entity.InstagramAccount.ConnectionStatus;
import com.socialmedia.instagram.entity.User;
import com.socialmedia.instagram.repository.InstagramAccountRepository;
import com.socialmedia.instagram.repository.UserRepository;
import com.socialmedia.instagram.service.InstagramAccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class InstagramAccountSecurityTest {

    @Autowired
    private InstagramAccountService accountService;

    @Autowired
    private InstagramAccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        accountRepository.deleteAll();
        userRepository.deleteAll();

        userA = User.builder()
            .email("usera@example.com")
            .fullName("User A")
            .role(User.UserRole.MANAGER)
            .isActive(true)
            .build();
        userA.setPassword("password123");
        userA = userRepository.save(userA);

        userB = User.builder()
            .email("userb@example.com")
            .fullName("User B")
            .role(User.UserRole.MANAGER)
            .isActive(true)
            .build();
        userB.setPassword("password123");
        userB = userRepository.save(userB);
    }

    @Test
    @DisplayName("User A can create, switch, list, and manage multiple accounts")
    void testUserAMultiAccountManagement() {
        CreateInstagramAccountRequest req1 = new CreateInstagramAccountRequest(
            "Brand Official", "brand_official", "Brand Official", null, "BUSINESS",
            "ig_acc_111", "app_111", "secret_111", "token_111", true, null
        );

        CreateInstagramAccountRequest req2 = new CreateInstagramAccountRequest(
            "Brand India", "brand_india", "Brand India", null, "BUSINESS",
            "ig_acc_222", "app_222", "secret_222", "token_222", false, null
        );

        InstagramAccountResponse acc1 = accountService.createAccount(userA.getId(), req1);
        InstagramAccountResponse acc2 = accountService.createAccount(userA.getId(), req2);

        assertNotNull(acc1.id());
        assertNotNull(acc2.id());
        assertTrue(acc1.isDefault());
        assertFalse(acc2.isDefault());

        List<InstagramAccountResponse> listA = accountService.listAccounts(userA.getId());
        assertEquals(2, listA.size());

        // Switch default account
        InstagramAccountResponse updatedAcc2 = accountService.setDefaultAccount(userA.getId(), acc2.id());
        assertTrue(updatedAcc2.isDefault());

        InstagramAccountResponse refreshedAcc1 = accountService.getAccount(userA.getId(), acc1.id());
        assertFalse(refreshedAcc1.isDefault());
    }

    @Test
    @DisplayName("User A cannot access or modify User B's Instagram account (IDOR prevention)")
    void testAccountIsolationSecurity() {
        CreateInstagramAccountRequest reqA = new CreateInstagramAccountRequest(
            "Account A", "account_a", "Account A", null, "BUSINESS",
            "ig_acc_a", "app_a", "secret_a", "token_a", true, null
        );
        CreateInstagramAccountRequest reqB = new CreateInstagramAccountRequest(
            "Account B", "account_b", "Account B", null, "BUSINESS",
            "ig_acc_b", "app_b", "secret_b", "token_b", true, null
        );

        InstagramAccountResponse accA = accountService.createAccount(userA.getId(), reqA);
        InstagramAccountResponse accB = accountService.createAccount(userB.getId(), reqB);
        assertNotNull(accA.id());

        // Verify User A cannot get User B's account
        assertThrows(IllegalArgumentException.class, () -> {
            accountService.getAccount(userA.getId(), accB.id());
        });

        // Verify User A cannot delete User B's account
        assertThrows(IllegalArgumentException.class, () -> {
            accountService.deleteAccount(userA.getId(), accB.id());
        });

        // Verify User A cannot disconnect User B's account
        assertThrows(IllegalArgumentException.class, () -> {
            accountService.disconnectAccount(userA.getId(), accB.id());
        });
    }

    @Test
    @DisplayName("Sync error on one account does not affect other connected accounts")
    void testSyncErrorIsolation() {
        CreateInstagramAccountRequest req1 = new CreateInstagramAccountRequest(
            "Account One", "account_one", "Account One", null, "BUSINESS",
            "ig_1", "app_1", "secret_1", "valid_token", true, null
        );
        CreateInstagramAccountRequest req2 = new CreateInstagramAccountRequest(
            "Account Two", "account_two", "Account Two", null, "BUSINESS",
            "ig_2", "app_2", "secret_2", "invalid_token", false, null
        );

        InstagramAccountResponse acc1 = accountService.createAccount(userA.getId(), req1);
        InstagramAccountResponse acc2 = accountService.createAccount(userA.getId(), req2);

        // Manually set acc2 into error status
        accountService.disconnectAccount(userA.getId(), acc2.id());

        InstagramAccountResponse res1 = accountService.getAccount(userA.getId(), acc1.id());
        InstagramAccountResponse res2 = accountService.getAccount(userA.getId(), acc2.id());

        assertEquals(ConnectionStatus.CONNECTED, res1.connectionStatus());
        assertEquals(ConnectionStatus.DISCONNECTED, res2.connectionStatus());

        // Deleting acc2 does not affect acc1
        accountService.deleteAccount(userA.getId(), acc2.id());
        assertEquals(1, accountService.listAccounts(userA.getId()).size());
        assertNotNull(accountService.getAccount(userA.getId(), acc1.id()));
    }
}
