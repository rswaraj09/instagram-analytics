package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.CampaignLinkAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampaignLinkAnalysisRepository extends JpaRepository<CampaignLinkAnalysis, UUID> {

    List<CampaignLinkAnalysis> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<CampaignLinkAnalysis> findAllByOrderByCreatedAtDesc();

    Optional<CampaignLinkAnalysis> findByIdAndUserId(UUID id, UUID userId);

    Optional<CampaignLinkAnalysis> findFirstByUserIdAndUrlOrderByCreatedAtDesc(UUID userId, String url);
}

