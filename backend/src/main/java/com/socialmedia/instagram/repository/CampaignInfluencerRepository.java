package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.CampaignInfluencer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CampaignInfluencerRepository extends JpaRepository<CampaignInfluencer, UUID> {
    List<CampaignInfluencer> findByCampaignId(UUID campaignId);
    List<CampaignInfluencer> findByCampaignIdIn(List<UUID> campaignIds);
    void deleteByCampaignId(UUID campaignId);
}
