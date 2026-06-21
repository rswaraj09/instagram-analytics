package com.socialmedia.instagram.config;

import com.socialmedia.instagram.entity.InstagramProfile;
import com.socialmedia.instagram.entity.User;
import com.socialmedia.instagram.repository.InstagramProfileRepository;
import com.socialmedia.instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Seeds a default admin user and Instagram profile for local development only.
 * Active under the "dev" profile (Issue 3) so production never auto-seeds.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final InstagramProfileRepository profileRepository;

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "admin@example.com";
        UUID defaultProfileId = UUID.fromString("123e4567-e89b-12d3-a456-426614174000");

        User admin;
        if (!userRepository.existsByEmail(adminEmail)) {
            log.info("Default admin user not found. Seeding admin@example.com...");
            admin = User.builder()
                    .email(adminEmail)
                    .fullName("System Admin")
                    .role(User.UserRole.ADMIN)
                    .isActive(true)
                    .build();
            admin.setPassword("password");
            admin = userRepository.save(admin);
            log.info("Default admin user seeded successfully with password: password");
        } else {
            log.info("Default admin user admin@example.com already exists.");
            admin = userRepository.findByEmail(adminEmail).orElseThrow();
        }

        if (profileRepository.existsByUsername("instagram")) {
            InstagramProfile existing = profileRepository.findByUsername("instagram").orElse(null);
            if (existing != null && !existing.getId().equals(defaultProfileId)) {
                log.info("Deleting existing profile with username 'instagram' and incorrect ID: {}", existing.getId());
                profileRepository.delete(existing);
                profileRepository.flush();
            }
        }

        if (!profileRepository.existsById(defaultProfileId)) {
            log.info("Default Instagram profile not found. Seeding profile with ID: {}", defaultProfileId);
            InstagramProfile profile = InstagramProfile.builder()
                    .id(defaultProfileId)
                    .username("instagram")
                    .profileUrl("https://www.instagram.com/instagram/")
                    .category("Social Media")
                    .followersCount(600000000L)
                    .followingCount(50L)
                    .totalPosts(1000)
                    .isBusinessAccount(false)
                    .addedBy(admin)
                    .build();
            profileRepository.save(profile);
            log.info("Default Instagram profile seeded successfully");
        } else {
            log.info("Default Instagram profile with ID {} already exists.", defaultProfileId);
        }
    }
}
