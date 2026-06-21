package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.InstagramAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InstagramAccountRepository extends JpaRepository<InstagramAccount, UUID> {

    List<InstagramAccount> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    Optional<InstagramAccount> findByIdAndUser_Id(UUID id, UUID userId);

    Optional<InstagramAccount> findFirstByUser_IdAndIsActiveTrueOrderByCreatedAtAsc(UUID userId);

    boolean existsByUser_IdAndIgUserId(UUID userId, String igUserId);
}
