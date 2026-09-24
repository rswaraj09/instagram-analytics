package com.socialmedia.instagram.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialmedia.instagram.dto.CampaignDTO;
import com.socialmedia.instagram.dto.CampaignDetailDTO;
import com.socialmedia.instagram.entity.Campaign;
import com.socialmedia.instagram.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CampaignServiceTest {

    @Mock
    private CampaignRepository campaignRepository;
    @Mock
    private CampaignContentRepository campaignContentRepository;
    @Mock
    private CampaignInfluencerRepository campaignInfluencerRepository;
    @Mock
    private CampaignMetricRepository campaignMetricRepository;
    @Mock
    private CampaignGoalRepository campaignGoalRepository;
    @Mock
    private CampaignAudienceRepository campaignAudienceRepository;
    @Mock
    private InstagramAccountRepository accountRepository;

    private CampaignAnalysisService analysisService;
    private CampaignInsightService insightService;
    private ObjectMapper objectMapper;
    private CampaignService campaignService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        analysisService = new CampaignAnalysisService();
        insightService = new CampaignInsightService(analysisService);
        objectMapper = new ObjectMapper();
        campaignService = new CampaignService(
                campaignRepository,
                campaignContentRepository,
                campaignInfluencerRepository,
                campaignMetricRepository,
                campaignGoalRepository,
                campaignAudienceRepository,
                accountRepository,
                analysisService,
                insightService,
                objectMapper
        );
    }

    @Test
    @DisplayName("Create campaign successfully")
    void testCreateCampaign() {
        UUID userId = UUID.randomUUID();
        Campaign req = Campaign.builder()
                .name("Summer Sales 2026")
                .objective("Conversions")
                .budget(5000.0)
                .build();

        Campaign saved = Campaign.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .name("Summer Sales 2026")
                .objective("Conversions")
                .budget(5000.0)
                .totalSpend(0.0)
                .revenue(0.0)
                .status("ACTIVE")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .build();

        when(campaignRepository.save(any(Campaign.class))).thenReturn(saved);

        CampaignDTO dto = campaignService.createCampaign(userId, req);
        assertNotNull(dto);
        assertEquals("Summer Sales 2026", dto.getName());
        assertEquals("Conversions", dto.getObjective());
    }

    @Test
    @DisplayName("Get campaign detail returns complete analytics structure")
    void testGetCampaignDetail() {
        UUID campaignId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Campaign campaign = Campaign.builder()
                .id(campaignId)
                .userId(userId)
                .name("Product Launch")
                .objective("Brand Awareness")
                .budget(2000.0)
                .status("ACTIVE")
                .build();

        when(campaignRepository.findByIdAndUserId(campaignId, userId)).thenReturn(Optional.of(campaign));
        when(campaignContentRepository.findByCampaignIdOrderByPublishedAtDesc(campaignId)).thenReturn(Collections.emptyList());
        when(campaignInfluencerRepository.findByCampaignId(campaignId)).thenReturn(Collections.emptyList());
        when(campaignGoalRepository.findByCampaignId(campaignId)).thenReturn(Collections.emptyList());
        when(campaignMetricRepository.findByCampaignIdOrderBySnapshotDateAsc(campaignId)).thenReturn(Collections.emptyList());

        CampaignDetailDTO detail = campaignService.getCampaignDetail(campaignId, userId);
        assertNotNull(detail);
        assertNotNull(detail.getCampaign());
        assertNotNull(detail.getAiInsights());
        assertEquals("Product Launch", detail.getCampaign().getName());
    }
}
