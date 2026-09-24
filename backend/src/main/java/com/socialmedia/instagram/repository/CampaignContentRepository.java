package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.CampaignContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CampaignContentRepository extends JpaRepository<CampaignContent, UUID> {
    List<CampaignContent> findByCampaignIdOrderByPublishedAtDesc(UUID campaignId);
    List<CampaignContent> findByCampaignIdIn(List<UUID> campaignIds);
    void deleteByCampaignId(UUID campaignId);
}
