package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.CampaignGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CampaignGoalRepository extends JpaRepository<CampaignGoal, UUID> {
    List<CampaignGoal> findByCampaignId(UUID campaignId);
    List<CampaignGoal> findByCampaignIdIn(List<UUID> campaignIds);
    void deleteByCampaignId(UUID campaignId);
}
