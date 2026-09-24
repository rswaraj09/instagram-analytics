package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.InstagramLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InstagramLinkRepository extends JpaRepository<InstagramLink, UUID> {

    List<InstagramLink> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<InstagramLink> findAllByOrderByCreatedAtDesc();

    List<InstagramLink> findByUserIdAndCampaignIdOrderByCreatedAtDesc(UUID userId, UUID campaignId);

    Optional<InstagramLink> findByIdAndUserId(UUID id, UUID userId);

    List<InstagramLink> findByCampaignId(UUID campaignId);
}

