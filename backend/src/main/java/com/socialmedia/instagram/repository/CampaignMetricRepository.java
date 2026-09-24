package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.CampaignMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampaignMetricRepository extends JpaRepository<CampaignMetric, UUID> {
    List<CampaignMetric> findByCampaignIdOrderBySnapshotDateAsc(UUID campaignId);
    List<CampaignMetric> findByCampaignIdAndSnapshotDateBetweenOrderBySnapshotDateAsc(
        UUID campaignId, LocalDate startDate, LocalDate endDate
    );
    Optional<CampaignMetric> findByCampaignIdAndSnapshotDate(UUID campaignId, LocalDate snapshotDate);
    List<CampaignMetric> findByCampaignIdIn(List<UUID> campaignIds);
    void deleteByCampaignId(UUID campaignId);
}
