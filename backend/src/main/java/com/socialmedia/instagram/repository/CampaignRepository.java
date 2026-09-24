package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, UUID> {
    List<Campaign> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Campaign> findAllByOrderByCreatedAtDesc();
    Optional<Campaign> findByIdAndUserId(UUID id, UUID userId);
    List<Campaign> findByIdInAndUserId(List<UUID> ids, UUID userId);
    List<Campaign> findByIdIn(List<UUID> ids);
}

