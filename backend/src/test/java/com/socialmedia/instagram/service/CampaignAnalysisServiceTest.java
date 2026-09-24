package com.socialmedia.instagram.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CampaignAnalysisServiceTest {

    private CampaignAnalysisService analysisService;

    @BeforeEach
    void setUp() {
        analysisService = new CampaignAnalysisService();
    }

    @Test
    @DisplayName("Calculate Engagement Rate accurately")
    void testCalculateEngagementRate() {
        // Likes=100, Comments=20, Shares=10, Saves=10 -> Total 140. Reach=2000 -> 140/2000 * 100 = 7.0%
        double er = analysisService.calculateEngagementRate(100, 20, 10, 10, 2000);
        assertEquals(7.0, er);
    }

    @Test
    @DisplayName("Calculate Engagement Rate safely when Reach is zero")
    void testCalculateEngagementRateZeroReach() {
        double er = analysisService.calculateEngagementRate(100, 20, 10, 10, 0);
        assertEquals(0.0, er);
        assertFalse(Double.isNaN(er));
        assertFalse(Double.isInfinite(er));
    }

    @Test
    @DisplayName("Calculate CTR accurately")
    void testCalculateCTR() {
        // Link Clicks=250, Impressions=5000 -> 250/5000 * 100 = 5.0%
        double ctr = analysisService.calculateCTR(250, 5000);
        assertEquals(5.0, ctr);
    }

    @Test
    @DisplayName("Calculate CTR safely when Impressions are zero")
    void testCalculateCTRZeroImpressions() {
        double ctr = analysisService.calculateCTR(100, 0);
        assertEquals(0.0, ctr);
        assertFalse(Double.isNaN(ctr));
    }

    @Test
    @DisplayName("Calculate CPM accurately")
    void testCalculateCPM() {
        // Spend=$150, Impressions=50,000 -> (150 / 50,000) * 1000 = $3.00
        double cpm = analysisService.calculateCPM(150.0, 50000);
        assertEquals(3.0, cpm);
    }

    @Test
    @DisplayName("Calculate CPM safely when Impressions are zero")
    void testCalculateCPMZeroImpressions() {
        double cpm = analysisService.calculateCPM(150.0, 0);
        assertEquals(0.0, cpm);
    }

    @Test
    @DisplayName("Calculate CPE accurately")
    void testCalculateCPE() {
        // Spend=$500, Engagements=2000 -> 500 / 2000 = $0.25
        double cpe = analysisService.calculateCPE(500.0, 2000);
        assertEquals(0.25, cpe);
    }

    @Test
    @DisplayName("Calculate CPE safely when Engagements are zero")
    void testCalculateCPEZeroEngagements() {
        double cpe = analysisService.calculateCPE(500.0, 0);
        assertEquals(0.0, cpe);
    }

    @Test
    @DisplayName("Calculate Conversion Rate accurately")
    void testCalculateConversionRate() {
        // Conversions=25, Clicks=500 -> (25/500) * 100 = 5.0%
        double convRate = analysisService.calculateConversionRate(25, 500);
        assertEquals(5.0, convRate);
    }

    @Test
    @DisplayName("Calculate Conversion Rate safely when Clicks are zero")
    void testCalculateConversionRateZeroClicks() {
        double convRate = analysisService.calculateConversionRate(25, 0);
        assertEquals(0.0, convRate);
    }

    @Test
    @DisplayName("Calculate ROAS accurately")
    void testCalculateROAS() {
        // Revenue=$2500, Spend=$500 -> 2500 / 500 = 5.0x
        double roas = analysisService.calculateROAS(2500.0, 500.0);
        assertEquals(5.0, roas);
    }

    @Test
    @DisplayName("Calculate ROAS safely when Spend is zero")
    void testCalculateROASZeroSpend() {
        double roas = analysisService.calculateROAS(1000.0, 0.0);
        assertEquals(0.0, roas);
    }

    @Test
    @DisplayName("Rounding helper never produces NaN or Infinity")
    void testRoundToTwoDecimals() {
        assertEquals(0.0, analysisService.roundToTwoDecimals(Double.NaN));
        assertEquals(0.0, analysisService.roundToTwoDecimals(Double.POSITIVE_INFINITY));
        assertEquals(0.0, analysisService.roundToTwoDecimals(Double.NEGATIVE_INFINITY));
        assertEquals(12.35, analysisService.roundToTwoDecimals(12.3456));
    }
}
