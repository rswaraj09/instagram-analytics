package com.socialmedia.instagram.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialmedia.instagram.dto.*;
import com.socialmedia.instagram.entity.*;
import com.socialmedia.instagram.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final CampaignContentRepository campaignContentRepository;
    private final CampaignInfluencerRepository campaignInfluencerRepository;
    private final CampaignMetricRepository campaignMetricRepository;
    private final CampaignGoalRepository campaignGoalRepository;
    private final CampaignAudienceRepository campaignAudienceRepository;
    private final InstagramAccountRepository accountRepository;
    private final CampaignAnalysisService analysisService;
    private final CampaignInsightService insightService;
    private final ObjectMapper objectMapper;

    @Transactional
    public List<CampaignDTO> getUserCampaigns(UUID userId) {
        List<Campaign> campaigns = userId != null ? 
                campaignRepository.findByUserIdOrderByCreatedAtDesc(userId) : 
                campaignRepository.findAllByOrderByCreatedAtDesc();
        campaigns.forEach(this::evaluateAndUpdateCampaignStatus);
        return campaigns.stream().map(this::toCampaignDTO).collect(Collectors.toList());
    }

    private void evaluateAndUpdateCampaignStatus(Campaign c) {
        if ("PAUSED".equalsIgnoreCase(c.getStatus()) || "FAILED".equalsIgnoreCase(c.getStatus())) {
            return;
        }
        LocalDate today = LocalDate.now();
        String calculatedStatus = c.getStatus();
        if (c.getStartDate() != null && today.isBefore(c.getStartDate())) {
            calculatedStatus = "SCHEDULED";
        } else if (c.getEndDate() != null && today.isAfter(c.getEndDate())) {
            calculatedStatus = "COMPLETED";
        } else {
            calculatedStatus = "ACTIVE";
        }
        if (!calculatedStatus.equalsIgnoreCase(c.getStatus())) {
            c.setStatus(calculatedStatus);
            c.setUpdatedAt(Instant.now());
            campaignRepository.save(c);
        }
    }

    @Transactional(readOnly = true)
    public CampaignDetailDTO getCampaignDetail(UUID campaignId, UUID userId) {
        Campaign campaign = (userId != null ? campaignRepository.findByIdAndUserId(campaignId, userId) : campaignRepository.findById(campaignId))
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found."));
        evaluateAndUpdateCampaignStatus(campaign);

        CampaignDTO campaignDTO = toCampaignDTO(campaign);
        List<CampaignContentDTO> contents = getCampaignContents(campaignId);
        List<CampaignInfluencerDTO> influencers = getCampaignInfluencers(campaignId);
        List<CampaignGoalDTO> goals = getCampaignGoals(campaignId);
        List<CampaignMetricDTO> metrics = getCampaignMetrics(campaignId, null, null, "daily");
        CampaignAudienceDTO audience = getCampaignAudience(campaignId);
        CampaignAIInsightsDTO insights = insightService.generateInsights(campaignDTO, contents, influencers, goals,
                audience);

        List<CampaignDetailDTO.AccountCampaignMetrics> accountBreakdown = new ArrayList<>();
        if (campaign.getCampaignAccounts() != null && !campaign.getCampaignAccounts().isEmpty()) {
            int count = campaign.getCampaignAccounts().size();
            for (InstagramAccount acc : campaign.getCampaignAccounts()) {
                String handle = "@" + (acc.getUsername() != null ? acc.getUsername() : acc.getAccountName());
                long r = campaignDTO.getTotalReach() != null ? campaignDTO.getTotalReach() / count : 0L;
                long imp = campaignDTO.getTotalImpressions() != null ? campaignDTO.getTotalImpressions() / count : 0L;
                long eng = campaignDTO.getTotalEngagements() != null ? campaignDTO.getTotalEngagements() / count : 0L;
                double er = campaignDTO.getEngagementRate() != null ? campaignDTO.getEngagementRate() : 0.0;
                double sp = campaignDTO.getTotalSpend() != null ? campaignDTO.getTotalSpend() / count : 0.0;
                double roas = campaignDTO.getRoas() != null ? campaignDTO.getRoas() : 0.0;

                accountBreakdown.add(CampaignDetailDTO.AccountCampaignMetrics.builder()
                        .username(handle)
                        .displayName(acc.getDisplayName() != null ? acc.getDisplayName() : acc.getAccountName())
                        .reach(r)
                        .impressions(imp)
                        .engagements(eng)
                        .engagementRate(er)
                        .spend(sp)
                        .roas(roas)
                        .build());
            }
        }

        return CampaignDetailDTO.builder()
                .campaign(campaignDTO)
                .contents(contents)
                .influencers(influencers)
                .goals(goals)
                .metrics(metrics)
                .audience(audience)
                .aiInsights(insights)
                .accountBreakdown(accountBreakdown)
                .build();
    }

    @Transactional
    public CampaignDTO createCampaign(UUID userId, Campaign request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Campaign name is required.");
        }
        if (request.getObjective() == null || request.getObjective().isBlank()) {
            request.setObjective("Brand Awareness");
        }

        request.setUserId(userId);
        request.setCreatedAt(Instant.now());
        request.setUpdatedAt(Instant.now());
        if (request.getBudget() == null)
            request.setBudget(1000.0);
        if (request.getTotalSpend() == null)
            request.setTotalSpend(0.0);
        if (request.getRevenue() == null)
            request.setRevenue(0.0);
        if (request.getStartDate() == null)
            request.setStartDate(LocalDate.now());
        if (request.getEndDate() == null)
            request.setEndDate(LocalDate.now().plusDays(30));
        if (request.getStatus() == null)
            request.setStatus("ACTIVE");

        Campaign saved = campaignRepository.save(request);

        // Seed initial default audience demographics
        CampaignAudience audience = CampaignAudience.builder()
                .campaignId(saved.getId())
                .ageGroups("{\"18-24\": 28.5, \"25-34\": 46.2, \"35-44\": 16.8, \"45-54\": 5.5, \"55+\": 3.0}")
                .genderDistribution("{\"Female\": 58.4, \"Male\": 39.2, \"Other\": 2.4}")
                .topCountries(
                        "{\"United States\": 38.0, \"India\": 24.5, \"United Kingdom\": 12.0, \"Canada\": 8.5, \"Germany\": 6.0}")
                .topCities(
                        "{\"New York\": 14.2, \"London\": 9.8, \"Los Angeles\": 8.5, \"Mumbai\": 7.4, \"Toronto\": 5.1}")
                .interests("[\"Technology\", \"Social Media\", \"Digital Marketing\", \"Lifestyle\", \"Ecommerce\"]")
                .followerReach(12500L)
                .nonFollowerReach(34200L)
                .build();
        campaignAudienceRepository.save(audience);

        // Seed default daily metrics for demo timeline if non-existent
        seedDefaultDailyMetrics(saved.getId(), saved.getStartDate(), saved.getEndDate());

        return toCampaignDTO(saved);
    }

    @Transactional
    public CampaignDTO updateCampaign(UUID campaignId, UUID userId, Campaign update) {
        Campaign campaign = (userId != null ? campaignRepository.findByIdAndUserId(campaignId, userId) : campaignRepository.findById(campaignId))
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found."));

        if (update.getName() != null && !update.getName().isBlank())
            campaign.setName(update.getName());
        if (update.getObjective() != null && !update.getObjective().isBlank())
            campaign.setObjective(update.getObjective());
        if (update.getBrand() != null)
            campaign.setBrand(update.getBrand());
        if (update.getCategory() != null)
            campaign.setCategory(update.getCategory());
        if (update.getStartDate() != null)
            campaign.setStartDate(update.getStartDate());
        if (update.getEndDate() != null)
            campaign.setEndDate(update.getEndDate());
        if (update.getBudget() != null)
            campaign.setBudget(update.getBudget());
        if (update.getTotalSpend() != null)
            campaign.setTotalSpend(update.getTotalSpend());
        if (update.getRevenue() != null)
            campaign.setRevenue(update.getRevenue());
        if (update.getStatus() != null)
            campaign.setStatus(update.getStatus());

        campaign.setUpdatedAt(Instant.now());
        Campaign saved = campaignRepository.save(campaign);
        return toCampaignDTO(saved);
    }

    @Transactional
    public void deleteCampaign(UUID campaignId, UUID userId) {
        Campaign campaign = (userId != null ? campaignRepository.findByIdAndUserId(campaignId, userId) : campaignRepository.findById(campaignId))
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found."));
        campaignRepository.delete(campaign);
    }

    // Content operations
    @Transactional
    public CampaignContentDTO addContent(UUID campaignId, UUID userId, CampaignContent content) {
        Campaign campaign = (userId != null ? campaignRepository.findByIdAndUserId(campaignId, userId) : campaignRepository.findById(campaignId))
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found."));

        content.setCampaignId(campaign.getId());
        if (content.getMediaType() == null)
            content.setMediaType("POST");
        if (content.getPublishedAt() == null)
            content.setPublishedAt(Instant.now());

        CampaignContent saved = campaignContentRepository.save(content);
        return toContentDTO(saved);
    }

    @Transactional
    public void deleteContent(UUID campaignId, UUID contentId, UUID userId) {
        (userId != null ? campaignRepository.findByIdAndUserId(campaignId, userId) : campaignRepository.findById(campaignId))
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found."));
        campaignContentRepository.deleteById(contentId);
    }

    // Influencer operations
    @Transactional
    public CampaignInfluencerDTO addInfluencer(UUID campaignId, UUID userId, CampaignInfluencer influencer) {
        Campaign campaign = (userId != null ? campaignRepository.findByIdAndUserId(campaignId, userId) : campaignRepository.findById(campaignId))
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found."));

        influencer.setCampaignId(campaign.getId());
        if (influencer.getInfluencerName() == null || influencer.getInfluencerName().isBlank()) {
            throw new IllegalArgumentException("Influencer name is required.");
        }

        CampaignInfluencer saved = campaignInfluencerRepository.save(influencer);
        return toInfluencerDTO(saved, 1);
    }

    @Transactional
    public void deleteInfluencer(UUID campaignId, UUID influencerId, UUID userId) {
        (userId != null ? campaignRepository.findByIdAndUserId(campaignId, userId) : campaignRepository.findById(campaignId))
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found."));
        campaignInfluencerRepository.deleteById(influencerId);
    }

    // Goal operations
    @Transactional
    public CampaignGoalDTO addGoal(UUID campaignId, UUID userId, CampaignGoal goal) {
        Campaign campaign = (userId != null ? campaignRepository.findByIdAndUserId(campaignId, userId) : campaignRepository.findById(campaignId))
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found."));

        goal.setCampaignId(campaign.getId());
        if (goal.getMetricType() == null || goal.getMetricType().isBlank()) {
            goal.setMetricType("REACH");
        }
        if (goal.getTargetValue() == null || goal.getTargetValue() <= 0) {
            goal.setTargetValue(10000.0);
        }

        CampaignGoal saved = campaignGoalRepository.save(goal);
        return toGoalDTO(saved);
    }

    @Transactional
    public void deleteGoal(UUID campaignId, UUID goalId, UUID userId) {
        (userId != null ? campaignRepository.findByIdAndUserId(campaignId, userId) : campaignRepository.findById(campaignId))
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found."));
        campaignGoalRepository.deleteById(goalId);
    }

    // Metrics over time
    @Transactional(readOnly = true)
    public List<CampaignMetricDTO> getCampaignMetrics(UUID campaignId, LocalDate startDate, LocalDate endDate,
            String period) {
        List<CampaignMetric> metrics;
        if (startDate != null && endDate != null) {
            metrics = campaignMetricRepository.findByCampaignIdAndSnapshotDateBetweenOrderBySnapshotDateAsc(campaignId,
                    startDate, endDate);
        } else {
            metrics = campaignMetricRepository.findByCampaignIdOrderBySnapshotDateAsc(campaignId);
        }

        if (metrics.isEmpty()) {
            return Collections.emptyList();
        }

        List<CampaignMetricDTO> dtos = metrics.stream().map(m -> {
            double er = analysisService.calculateEngagementRate(m.getLikes(), m.getComments(), m.getShares(),
                    m.getSaves(), m.getReach());
            return CampaignMetricDTO.builder()
                    .date(m.getSnapshotDate())
                    .reach(m.getReach())
                    .impressions(m.getImpressions())
                    .likes(m.getLikes())
                    .comments(m.getComments())
                    .shares(m.getShares())
                    .saves(m.getSaves())
                    .videoViews(m.getVideoViews())
                    .profileVisits(m.getProfileVisits())
                    .followerGrowth(m.getFollowerGrowth())
                    .linkClicks(m.getLinkClicks())
                    .conversions(m.getConversions())
                    .spend(m.getSpend())
                    .revenue(m.getRevenue())
                    .engagementRate(er)
                    .build();
        }).collect(Collectors.toList());

        if ("weekly".equalsIgnoreCase(period)) {
            return aggregateWeeklyMetrics(dtos);
        }

        return dtos;
    }

    @Transactional
    public CampaignMetricDTO addOrUpdateDailyMetric(UUID campaignId, UUID userId, CampaignMetric metric) {
        (userId != null ? campaignRepository.findByIdAndUserId(campaignId, userId) : campaignRepository.findById(campaignId))
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found."));

        if (metric.getSnapshotDate() == null)
            metric.setSnapshotDate(LocalDate.now());

        Optional<CampaignMetric> existing = campaignMetricRepository.findByCampaignIdAndSnapshotDate(campaignId,
                metric.getSnapshotDate());
        CampaignMetric toSave;
        if (existing.isPresent()) {
            toSave = existing.get();
            toSave.setReach(metric.getReach() != null ? metric.getReach() : toSave.getReach());
            toSave.setImpressions(metric.getImpressions() != null ? metric.getImpressions() : toSave.getImpressions());
            toSave.setLikes(metric.getLikes() != null ? metric.getLikes() : toSave.getLikes());
            toSave.setComments(metric.getComments() != null ? metric.getComments() : toSave.getComments());
            toSave.setShares(metric.getShares() != null ? metric.getShares() : toSave.getShares());
            toSave.setSaves(metric.getSaves() != null ? metric.getSaves() : toSave.getSaves());
            toSave.setVideoViews(metric.getVideoViews() != null ? metric.getVideoViews() : toSave.getVideoViews());
            toSave.setProfileVisits(
                    metric.getProfileVisits() != null ? metric.getProfileVisits() : toSave.getProfileVisits());
            toSave.setFollowerGrowth(
                    metric.getFollowerGrowth() != null ? metric.getFollowerGrowth() : toSave.getFollowerGrowth());
            toSave.setLinkClicks(metric.getLinkClicks() != null ? metric.getLinkClicks() : toSave.getLinkClicks());
            toSave.setConversions(metric.getConversions() != null ? metric.getConversions() : toSave.getConversions());
            toSave.setSpend(metric.getSpend() != null ? metric.getSpend() : toSave.getSpend());
            toSave.setRevenue(metric.getRevenue() != null ? metric.getRevenue() : toSave.getRevenue());
        } else {
            metric.setCampaignId(campaignId);
            toSave = metric;
        }

        CampaignMetric saved = campaignMetricRepository.save(toSave);
        double er = analysisService.calculateEngagementRate(saved.getLikes(), saved.getComments(), saved.getShares(),
                saved.getSaves(), saved.getReach());

        return CampaignMetricDTO.builder()
                .date(saved.getSnapshotDate())
                .reach(saved.getReach())
                .impressions(saved.getImpressions())
                .likes(saved.getLikes())
                .comments(saved.getComments())
                .shares(saved.getShares())
                .saves(saved.getSaves())
                .videoViews(saved.getVideoViews())
                .profileVisits(saved.getProfileVisits())
                .followerGrowth(saved.getFollowerGrowth())
                .linkClicks(saved.getLinkClicks())
                .conversions(saved.getConversions())
                .spend(saved.getSpend())
                .revenue(saved.getRevenue())
                .engagementRate(er)
                .build();
    }

    // Comparison
    @Transactional(readOnly = true)
    public CampaignComparisonDTO compareCampaigns(UUID userId, List<UUID> campaignIds) {
        if (campaignIds == null || campaignIds.isEmpty()) {
            return CampaignComparisonDTO.builder().campaigns(Collections.emptyList()).build();
        }

        List<Campaign> campaigns = userId != null ? campaignRepository.findByIdInAndUserId(campaignIds, userId) : campaignRepository.findByIdIn(campaignIds);
        List<CampaignDTO> dtos = campaigns.stream().map(this::toCampaignDTO).collect(Collectors.toList());

        CampaignDTO best = dtos.stream()
                .max(Comparator.comparing(c -> (c.getEngagementRate() != null ? c.getEngagementRate() : 0.0) +
                        (c.getRoas() != null ? c.getRoas() * 2.0 : 0.0)))
                .orElse(null);

        String bestId = best != null ? best.getId().toString() : null;
        String bestName = best != null ? best.getName() : null;

        String summary = best != null
                ? String.format(
                        "'%s' is the top performing campaign with an Engagement Rate of %.2f%% and ROAS of %.2fx.",
                        bestName, best.getEngagementRate(), best.getRoas())
                : "No campaign data available for comparison.";

        return CampaignComparisonDTO.builder()
                .campaigns(dtos)
                .bestPerformingCampaignId(bestId)
                .bestPerformingCampaignName(bestName)
                .comparisonSummary(summary)
                .build();
    }

    // Convertors
    private CampaignDTO toCampaignDTO(Campaign campaign) {
        List<CampaignMetric> metrics = campaignMetricRepository
                .findByCampaignIdOrderBySnapshotDateAsc(campaign.getId());
        List<CampaignContent> contents = campaignContentRepository
                .findByCampaignIdOrderByPublishedAtDesc(campaign.getId());
        List<CampaignInfluencer> influencers = campaignInfluencerRepository.findByCampaignId(campaign.getId());

        long totalReach = metrics.stream().mapToLong(m -> m.getReach() != null ? m.getReach() : 0L).sum();
        long totalImpressions = metrics.stream().mapToLong(m -> m.getImpressions() != null ? m.getImpressions() : 0L)
                .sum();
        long likes = metrics.stream().mapToLong(m -> m.getLikes() != null ? m.getLikes() : 0).sum();
        long comments = metrics.stream().mapToLong(m -> m.getComments() != null ? m.getComments() : 0).sum();
        long shares = metrics.stream().mapToLong(m -> m.getShares() != null ? m.getShares() : 0).sum();
        long saves = metrics.stream().mapToLong(m -> m.getSaves() != null ? m.getSaves() : 0).sum();
        long videoViews = metrics.stream().mapToLong(m -> m.getVideoViews() != null ? m.getVideoViews() : 0L).sum();
        long profileVisits = metrics.stream().mapToLong(m -> m.getProfileVisits() != null ? m.getProfileVisits() : 0)
                .sum();
        int followerGrowth = metrics.stream().mapToInt(m -> m.getFollowerGrowth() != null ? m.getFollowerGrowth() : 0)
                .sum();
        long linkClicks = metrics.stream().mapToLong(m -> m.getLinkClicks() != null ? m.getLinkClicks() : 0).sum();
        int conversions = metrics.stream().mapToInt(m -> m.getConversions() != null ? m.getConversions() : 0).sum();

        // Also add contents contribution if metrics snapshot is less
        long contentReach = contents.stream().mapToLong(c -> c.getReach() != null ? c.getReach() : 0L).sum();
        long contentImpressions = contents.stream().mapToLong(c -> c.getImpressions() != null ? c.getImpressions() : 0L)
                .sum();
        long contentLikes = contents.stream().mapToLong(c -> c.getLikes() != null ? c.getLikes() : 0).sum();
        long contentComments = contents.stream().mapToLong(c -> c.getComments() != null ? c.getComments() : 0).sum();
        long contentShares = contents.stream().mapToLong(c -> c.getShares() != null ? c.getShares() : 0).sum();
        long contentSaves = contents.stream().mapToLong(c -> c.getSaves() != null ? c.getSaves() : 0).sum();
        long contentClicks = contents.stream().mapToLong(c -> c.getLinkClicks() != null ? c.getLinkClicks() : 0).sum();
        int contentConversions = contents.stream().mapToInt(c -> c.getConversions() != null ? c.getConversions() : 0)
                .sum();

        if (totalReach < contentReach)
            totalReach = contentReach;
        if (totalImpressions < contentImpressions)
            totalImpressions = contentImpressions;
        if (likes < contentLikes)
            likes = contentLikes;
        if (comments < contentComments)
            comments = contentComments;
        if (shares < contentShares)
            shares = contentShares;
        if (saves < contentSaves)
            saves = contentSaves;
        if (linkClicks < contentClicks)
            linkClicks = contentClicks;
        if (conversions < contentConversions)
            conversions = contentConversions;

        double spend = metrics.stream().mapToDouble(m -> m.getSpend() != null ? m.getSpend() : 0.0).sum();
        if (spend <= 0.0 && campaign.getTotalSpend() != null) {
            spend = campaign.getTotalSpend();
        }

        double revenue = metrics.stream().mapToDouble(m -> m.getRevenue() != null ? m.getRevenue() : 0.0).sum();
        if (revenue <= 0.0 && campaign.getRevenue() != null) {
            revenue = campaign.getRevenue();
        }

        long totalEngagements = likes + comments + shares + saves;
        double er = analysisService.calculateEngagementRate(likes, comments, shares, saves, totalReach);
        double cpe = analysisService.calculateCPE(spend, totalEngagements);
        double cpc = analysisService.calculateCPC(spend, linkClicks);
        double cpm = analysisService.calculateCPM(spend, totalImpressions);
        double ctr = analysisService.calculateCTR(linkClicks, totalImpressions);
        double convRate = analysisService.calculateConversionRate(conversions, linkClicks);
        double roas = analysisService.calculateROAS(revenue, spend);

        // Map Instagram Account identities
        List<InstagramAccountSummaryDTO> accountSummaries = new ArrayList<>();
        if (campaign.getCampaignAccounts() != null && !campaign.getCampaignAccounts().isEmpty()) {
            for (InstagramAccount acc : campaign.getCampaignAccounts()) {
                String pUrl = "https://www.instagram.com/" + (acc.getUsername() != null ? acc.getUsername() : "");
                InstagramAccountSummaryDTO dto = InstagramAccountSummaryDTO.builder()
                        .id(acc.getId() != null ? acc.getId().toString() : null)
                        .username(acc.getUsername() != null ? acc.getUsername() : acc.getAccountName())
                        .displayName(acc.getDisplayName() != null ? acc.getDisplayName() : acc.getAccountName())
                        .profilePicture(acc.getProfilePicture())
                        .profilePictureUrl(acc.getProfilePicture())
                        .igUserId(acc.getIgUserId())
                        .profileUrl(pUrl)
                        .build();
                accountSummaries.add(dto);
            }
        }

        if (accountSummaries.isEmpty()) {
            // Contextual fallback mapping based on campaign properties so every campaign has an account identity
            String brandName = (campaign.getBrand() != null && !campaign.getBrand().isBlank()) 
                    ? campaign.getBrand() 
                    : (campaign.getName() != null ? campaign.getName() : "Instagram Account");
            String handle = brandName.toLowerCase().replaceAll("[^a-z0-9]", "_");
            if (handle.length() > 20) handle = handle.substring(0, 20);
            
            InstagramAccountSummaryDTO fallbackAcc = InstagramAccountSummaryDTO.builder()
                    .id("acc-" + Math.abs(brandName.hashCode()))
                    .username(handle)
                    .displayName(brandName)
                    .profilePictureUrl("https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150")
                    .profilePicture("https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150")
                    .profileUrl("https://www.instagram.com/" + handle)
                    .build();
            accountSummaries.add(fallbackAcc);
        }

        InstagramAccountSummaryDTO primaryAccount = accountSummaries.get(0);
        List<String> accountHandles = accountSummaries.stream()
                .map(InstagramAccountSummaryDTO::getUsername)
                .collect(Collectors.toList());

        List<CampaignContentDTO> contentDTOs = contents.stream().map(this::toContentDTO).collect(Collectors.toList());
        if (contentDTOs.isEmpty()) {
            contentDTOs = generateDefaultContentDTOsForCampaign(campaign);
        }

        return CampaignDTO.builder()
                .id(campaign.getId())
                .userId(campaign.getUserId())
                .name(campaign.getName())
                .objective(campaign.getObjective())
                .brand(campaign.getBrand())
                .category(campaign.getCategory())
                .startDate(campaign.getStartDate())
                .endDate(campaign.getEndDate())
                .budget(campaign.getBudget())
                .totalSpend(spend)
                .revenue(revenue)
                .status(campaign.getStatus())
                .createdAt(campaign.getCreatedAt())
                .updatedAt(campaign.getUpdatedAt())
                .accountHandles(accountHandles)
                .instagramAccount(primaryAccount)
                .instagramAccounts(accountSummaries)
                .totalReach(totalReach)
                .totalImpressions(totalImpressions)
                .totalEngagements(totalEngagements)
                .engagementRate(er)
                .totalLikes(likes)
                .totalComments(comments)
                .totalShares(shares)
                .totalSaves(saves)
                .totalVideoViews(videoViews)
                .totalProfileVisits(profileVisits)
                .totalFollowerGrowth(followerGrowth)
                .totalLinkClicks(linkClicks)
                .totalConversions(conversions)
                .conversionRate(convRate)
                .ctr(ctr)
                .cpe(cpe)
                .cpc(cpc)
                .cpm(cpm)
                .roas(roas)
                .contentCount(contentDTOs.size())
                .influencerCount(influencers.size())
                .contents(contentDTOs)
                .build();
    }

    private List<CampaignContentDTO> generateDefaultContentDTOsForCampaign(Campaign campaign) {
        String brandOrName = (campaign.getBrand() != null && !campaign.getBrand().isBlank()) 
                ? campaign.getBrand() 
                : (campaign.getName() != null ? campaign.getName() : "Campaign");
        int seed = Math.abs(campaign.getId() != null ? campaign.getId().hashCode() : brandOrName.hashCode());
        
        String[][] mediaPool = {
            {"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80", "REEL", "https://instagram.com/p/reel_" + seed + "_1"},
            {"https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80", "POST", "https://instagram.com/p/post_" + seed + "_1"},
            {"https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80", "REEL", "https://instagram.com/p/reel_" + seed + "_2"},
            {"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80", "POST", "https://instagram.com/p/post_" + seed + "_2"},
            {"https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80", "REEL", "https://instagram.com/p/reel_" + seed + "_3"},
            {"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80", "POST", "https://instagram.com/p/post_" + seed + "_3"},
            {"https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80", "REEL", "https://instagram.com/p/reel_" + seed + "_4"},
            {"https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80", "POST", "https://instagram.com/p/post_" + seed + "_4"},
            {"https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80", "REEL", "https://instagram.com/p/reel_" + seed + "_5"},
            {"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80", "POST", "https://instagram.com/p/post_" + seed + "_5"}
        };

        int index1 = seed % mediaPool.length;
        int index2 = (seed + 3) % mediaPool.length;

        CampaignContentDTO c1 = CampaignContentDTO.builder()
                .id(UUID.nameUUIDFromBytes(("content-1-" + seed).getBytes()))
                .campaignId(campaign.getId())
                .mediaId("media_" + seed + "_1")
                .mediaType(mediaPool[index1][1])
                .caption("🔥 Official campaign post for " + campaign.getName() + "! Check out the latest updates.")
                .permalink(mediaPool[index1][2])
                .thumbnailUrl(mediaPool[index1][0])
                .publishedAt(Instant.now().minusSeconds(86400 * 4))
                .reach(14200L)
                .impressions(18900L)
                .likes(1240)
                .comments(142)
                .shares(88)
                .saves(210)
                .views(15600L)
                .linkClicks(340)
                .conversions(24)
                .engagementRate(11.8)
                .ctr(1.8)
                .build();

        CampaignContentDTO c2 = CampaignContentDTO.builder()
                .id(UUID.nameUUIDFromBytes(("content-2-" + seed).getBytes()))
                .campaignId(campaign.getId())
                .mediaId("media_" + seed + "_2")
                .mediaType(mediaPool[index2][1])
                .caption("Behind the scenes content for " + campaign.getName() + " 📲 Swipe for details!")
                .permalink(mediaPool[index2][2])
                .thumbnailUrl(mediaPool[index2][0])
                .publishedAt(Instant.now().minusSeconds(86400 * 2))
                .reach(9800L)
                .impressions(12300L)
                .likes(860)
                .comments(64)
                .shares(45)
                .saves(112)
                .views(9900L)
                .linkClicks(180)
                .conversions(14)
                .engagementRate(10.5)
                .ctr(1.5)
                .build();

        return List.of(c1, c2);
    }

    private List<CampaignContentDTO> getCampaignContents(UUID campaignId) {
        List<CampaignContent> list = campaignContentRepository.findByCampaignIdOrderByPublishedAtDesc(campaignId);
        return list.stream().map(this::toContentDTO).collect(Collectors.toList());
    }

    private CampaignContentDTO toContentDTO(CampaignContent c) {
        long reach = c.getReach() != null ? c.getReach() : 0L;
        long impressions = c.getImpressions() != null ? c.getImpressions() : 0L;
        int likes = c.getLikes() != null ? c.getLikes() : 0;
        int comments = c.getComments() != null ? c.getComments() : 0;
        int shares = c.getShares() != null ? c.getShares() : 0;
        int saves = c.getSaves() != null ? c.getSaves() : 0;
        int clicks = c.getLinkClicks() != null ? c.getLinkClicks() : 0;

        double er = analysisService.calculateEngagementRate(likes, comments, shares, saves, reach);
        double ctr = analysisService.calculateCTR(clicks, impressions);

        return CampaignContentDTO.builder()
                .id(c.getId())
                .campaignId(c.getCampaignId())
                .mediaId(c.getMediaId())
                .mediaType(c.getMediaType())
                .caption(c.getCaption())
                .permalink(c.getPermalink())
                .thumbnailUrl(c.getThumbnailUrl())
                .publishedAt(c.getPublishedAt())
                .reach(reach)
                .impressions(impressions)
                .likes(likes)
                .comments(comments)
                .shares(shares)
                .saves(saves)
                .views(c.getViews() != null ? c.getViews() : 0L)
                .linkClicks(clicks)
                .conversions(c.getConversions() != null ? c.getConversions() : 0)
                .engagementRate(er)
                .ctr(ctr)
                .createdAt(c.getCreatedAt())
                .build();
    }

    private List<CampaignInfluencerDTO> getCampaignInfluencers(UUID campaignId) {
        List<CampaignInfluencer> list = campaignInfluencerRepository.findByCampaignId(campaignId);
        // Rank influencers by total engagements / performance
        list.sort((a, b) -> Integer.compare(b.getEngagements() != null ? b.getEngagements() : 0,
                a.getEngagements() != null ? a.getEngagements() : 0));

        List<CampaignInfluencerDTO> dtos = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            dtos.add(toInfluencerDTO(list.get(i), i + 1));
        }
        return dtos;
    }

    private CampaignInfluencerDTO toInfluencerDTO(CampaignInfluencer inf, int rank) {
        long reach = inf.getReach() != null ? inf.getReach() : 0L;
        int engagements = inf.getEngagements() != null ? inf.getEngagements() : 0;
        double cost = inf.getCost() != null ? inf.getCost() : 0.0;
        int conversions = inf.getConversions() != null ? inf.getConversions() : 0;

        double er = reach > 0 ? analysisService.roundToTwoDecimals((engagements / (double) reach) * 100.0) : 0.0;
        double cpe = analysisService.calculateInfluencerCPE(cost, engagements);
        double roi = analysisService.calculateInfluencerROI(cost, conversions, 50.0); // Assume estimated conversion
                                                                                      // value $50

        return CampaignInfluencerDTO.builder()
                .id(inf.getId())
                .campaignId(inf.getCampaignId())
                .influencerName(inf.getInfluencerName())
                .handle(inf.getHandle())
                .followers(inf.getFollowers())
                .reach(reach)
                .engagements(engagements)
                .contentCount(inf.getContentCount())
                .cost(cost)
                .conversions(conversions)
                .notes(inf.getNotes())
                .engagementRate(er)
                .cpe(cpe)
                .roi(roi)
                .rank(rank)
                .createdAt(inf.getCreatedAt())
                .build();
    }

    private List<CampaignGoalDTO> getCampaignGoals(UUID campaignId) {
        List<CampaignGoal> goals = campaignGoalRepository.findByCampaignId(campaignId);
        return goals.stream().map(this::toGoalDTO).collect(Collectors.toList());
    }

    private CampaignGoalDTO toGoalDTO(CampaignGoal g) {
        double target = g.getTargetValue() != null ? g.getTargetValue() : 1.0;
        double current = g.getCurrentValue() != null ? g.getCurrentValue() : 0.0;
        double progress = target > 0 ? analysisService.roundToTwoDecimals((current / target) * 100.0) : 0.0;
        boolean onTrack = progress >= 50.0; // simple indicator

        return CampaignGoalDTO.builder()
                .id(g.getId())
                .campaignId(g.getCampaignId())
                .metricType(g.getMetricType())
                .targetValue(target)
                .currentValue(current)
                .progressPercentage(progress)
                .isOnTrack(onTrack)
                .createdAt(g.getCreatedAt())
                .build();
    }

    private CampaignAudienceDTO getCampaignAudience(UUID campaignId) {
        Optional<CampaignAudience> audOpt = campaignAudienceRepository.findByCampaignId(campaignId);
        if (audOpt.isEmpty()) {
            return CampaignAudienceDTO.builder()
                    .ageGroups(Map.of("18-24", 30.0, "25-34", 45.0, "35-44", 15.0, "45+", 10.0))
                    .genderDistribution(Map.of("Female", 60.0, "Male", 38.0, "Other", 2.0))
                    .topCountries(Map.of("United States", 40.0, "India", 25.0, "UK", 15.0, "Canada", 10.0))
                    .topCities(Map.of("New York", 20.0, "Los Angeles", 15.0, "London", 10.0))
                    .interests(List.of("Marketing", "Social Media", "Technology", "Fashion"))
                    .followerReach(10000L)
                    .nonFollowerReach(25000L)
                    .build();
        }

        CampaignAudience aud = audOpt.get();
        Map<String, Double> ageGroups = parseJsonMap(aud.getAgeGroups());
        Map<String, Double> genderDist = parseJsonMap(aud.getGenderDistribution());
        Map<String, Double> topCountries = parseJsonMap(aud.getTopCountries());
        Map<String, Double> topCities = parseJsonMap(aud.getTopCities());
        List<String> interests = parseJsonList(aud.getInterests());

        return CampaignAudienceDTO.builder()
                .ageGroups(ageGroups)
                .genderDistribution(genderDist)
                .topCountries(topCountries)
                .topCities(topCities)
                .interests(interests)
                .followerReach(aud.getFollowerReach() != null ? aud.getFollowerReach() : 0L)
                .nonFollowerReach(aud.getNonFollowerReach() != null ? aud.getNonFollowerReach() : 0L)
                .build();
    }

    private Map<String, Double> parseJsonMap(String json) {
        if (json == null || json.isBlank())
            return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Double>>() {
            });
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank())
            return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private void seedDefaultDailyMetrics(UUID campaignId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null)
            startDate = LocalDate.now().minusDays(14);
        if (endDate == null)
            endDate = LocalDate.now();

        LocalDate cur = startDate;
        int dayCount = 0;
        Random rand = new Random(campaignId.hashCode());

        while (!cur.isAfter(endDate) && dayCount < 30) {
            long reach = 1500 + rand.nextInt(2000);
            long impressions = reach + 800 + rand.nextInt(1500);
            int likes = 120 + rand.nextInt(200);
            int comments = 15 + rand.nextInt(35);
            int shares = 20 + rand.nextInt(40);
            int saves = 25 + rand.nextInt(45);
            long videoViews = 800 + rand.nextInt(1200);
            int profileVisits = 40 + rand.nextInt(80);
            int followerGrowth = 10 + rand.nextInt(30);
            int linkClicks = 35 + rand.nextInt(60);
            int conversions = 3 + rand.nextInt(12);
            double spend = 25.0 + rand.nextInt(30);
            double revenue = spend * (1.8 + (rand.nextDouble() * 1.5));

            CampaignMetric m = CampaignMetric.builder()
                    .campaignId(campaignId)
                    .snapshotDate(cur)
                    .reach(reach)
                    .impressions(impressions)
                    .likes(likes)
                    .comments(comments)
                    .shares(shares)
                    .saves(saves)
                    .videoViews(videoViews)
                    .profileVisits(profileVisits)
                    .followerGrowth(followerGrowth)
                    .linkClicks(linkClicks)
                    .conversions(conversions)
                    .spend(analysisService.roundToTwoDecimals(spend))
                    .revenue(analysisService.roundToTwoDecimals(revenue))
                    .createdAt(Instant.now())
                    .build();
            campaignMetricRepository.save(m);

            cur = cur.plusDays(1);
            dayCount++;
        }

        // Also seed initial default contents
        CampaignContent c1 = CampaignContent.builder()
                .campaignId(campaignId)
                .mediaType("REEL")
                .caption("🚀 Unlocking maximum viral reach on Instagram with AI strategies #marketing #reels")
                .permalink("https://instagram.com/p/demo_reel_1")
                .thumbnailUrl("https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400")
                .publishedAt(Instant.now().minusSeconds(86400 * 5))
                .reach(18500L)
                .impressions(24200L)
                .likes(1420)
                .comments(184)
                .shares(310)
                .saves(420)
                .views(19800L)
                .linkClicks(420)
                .conversions(45)
                .build();

        CampaignContent c2 = CampaignContent.builder()
                .campaignId(campaignId)
                .mediaType("POST")
                .caption("Top 5 growth tips for content creators in 2026. Swipe left to read 📲")
                .permalink("https://instagram.com/p/demo_post_1")
                .thumbnailUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80")
                .publishedAt(Instant.now().minusSeconds(86400 * 3))
                .reach(9800L)
                .impressions(12400L)
                .likes(620)
                .comments(48)
                .shares(85)
                .saves(130)
                .views(0L)
                .linkClicks(140)
                .conversions(12)
                .build();

        campaignContentRepository.save(c1);
        campaignContentRepository.save(c2);

        // Also seed sample goals
        CampaignGoal g1 = CampaignGoal.builder()
                .campaignId(campaignId)
                .metricType("REACH")
                .targetValue(50000.0)
                .currentValue(38200.0)
                .build();
        CampaignGoal g2 = CampaignGoal.builder()
                .campaignId(campaignId)
                .metricType("CONVERSIONS")
                .targetValue(100.0)
                .currentValue(57.0)
                .build();
        campaignGoalRepository.save(g1);
        campaignGoalRepository.save(g2);

        // Also seed sample influencer
        CampaignInfluencer inf = CampaignInfluencer.builder()
                .campaignId(campaignId)
                .influencerName("Sarah Jenkins")
                .handle("sarah_digital")
                .followers(85000)
                .reach(32000L)
                .engagements(2450)
                .contentCount(2)
                .cost(350.0)
                .conversions(28)
                .notes("Strong audience crossover in tech/lifestyle niche")
                .build();
        campaignInfluencerRepository.save(inf);
    }

    private List<CampaignMetricDTO> aggregateWeeklyMetrics(List<CampaignMetricDTO> daily) {
        Map<String, List<CampaignMetricDTO>> grouped = new LinkedHashMap<>();
        for (CampaignMetricDTO m : daily) {
            // Group by week (start date of week)
            LocalDate d = m.getDate();
            LocalDate weekStart = d.minusDays(d.getDayOfWeek().getValue() - 1);
            String weekKey = weekStart.toString();
            grouped.computeIfAbsent(weekKey, k -> new ArrayList<>()).add(m);
        }

        List<CampaignMetricDTO> weekly = new ArrayList<>();
        for (Map.Entry<String, List<CampaignMetricDTO>> entry : grouped.entrySet()) {
            List<CampaignMetricDTO> list = entry.getValue();
            long reach = list.stream().mapToLong(m -> m.getReach() != null ? m.getReach() : 0).sum();
            long impressions = list.stream().mapToLong(m -> m.getImpressions() != null ? m.getImpressions() : 0).sum();
            int likes = list.stream().mapToInt(m -> m.getLikes() != null ? m.getLikes() : 0).sum();
            int comments = list.stream().mapToInt(m -> m.getComments() != null ? m.getComments() : 0).sum();
            int shares = list.stream().mapToInt(m -> m.getShares() != null ? m.getShares() : 0).sum();
            int saves = list.stream().mapToInt(m -> m.getSaves() != null ? m.getSaves() : 0).sum();
            long views = list.stream().mapToLong(m -> m.getVideoViews() != null ? m.getVideoViews() : 0).sum();
            int visits = list.stream().mapToInt(m -> m.getProfileVisits() != null ? m.getProfileVisits() : 0).sum();
            int growth = list.stream().mapToInt(m -> m.getFollowerGrowth() != null ? m.getFollowerGrowth() : 0).sum();
            int clicks = list.stream().mapToInt(m -> m.getLinkClicks() != null ? m.getLinkClicks() : 0).sum();
            int convs = list.stream().mapToInt(m -> m.getConversions() != null ? m.getConversions() : 0).sum();
            double spend = list.stream().mapToDouble(m -> m.getSpend() != null ? m.getSpend() : 0.0).sum();
            double rev = list.stream().mapToDouble(m -> m.getRevenue() != null ? m.getRevenue() : 0.0).sum();
            double er = analysisService.calculateEngagementRate(likes, comments, shares, saves, reach);

            weekly.add(CampaignMetricDTO.builder()
                    .date(LocalDate.parse(entry.getKey()))
                    .reach(reach)
                    .impressions(impressions)
                    .likes(likes)
                    .comments(comments)
                    .shares(shares)
                    .saves(saves)
                    .videoViews(views)
                    .profileVisits(visits)
                    .followerGrowth(growth)
                    .linkClicks(clicks)
                    .conversions(convs)
                    .spend(analysisService.roundToTwoDecimals(spend))
                    .revenue(analysisService.roundToTwoDecimals(rev))
                    .engagementRate(er)
                    .build());
        }
        return weekly;
    }
}
