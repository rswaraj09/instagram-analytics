package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.CampaignAudience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampaignAudienceRepository extends JpaRepository<CampaignAudience, UUID> {
    Optional<CampaignAudience> findByCampaignId(UUID campaignId);
    void deleteByCampaignId(UUID campaignId);
}
