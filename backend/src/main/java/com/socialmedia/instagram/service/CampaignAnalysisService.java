package com.socialmedia.instagram.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class CampaignAnalysisService {

    /**
     * Engagement Rate = (Likes + Comments + Shares + Saves) / Reach * 100
     */
    public double calculateEngagementRate(long likes, long comments, long shares, long saves, long reach) {
        if (reach <= 0) return 0.0;
        double totalEngagements = (double) (likes + comments + shares + saves);
        double er = (totalEngagements / reach) * 100.0;
        return roundToTwoDecimals(er);
    }

    /**
     * CTR = Link Clicks / Impressions * 100
     */
    public double calculateCTR(long linkClicks, long impressions) {
        if (impressions <= 0) return 0.0;
        double ctr = ((double) linkClicks / impressions) * 100.0;
        return roundToTwoDecimals(ctr);
    }

    /**
     * CPM = Campaign Spend / Impressions * 1000
     */
    public double calculateCPM(double campaignSpend, long impressions) {
        if (impressions <= 0 || campaignSpend < 0) return 0.0;
        double cpm = (campaignSpend / impressions) * 1000.0;
        return roundToTwoDecimals(cpm);
    }

    /**
     * CPE = Campaign Spend / Total Engagements
     */
    public double calculateCPE(double campaignSpend, long totalEngagements) {
        if (totalEngagements <= 0 || campaignSpend < 0) return 0.0;
        double cpe = campaignSpend / totalEngagements;
        return roundToTwoDecimals(cpe);
    }

    /**
     * CPC = Campaign Spend / Link Clicks
     */
    public double calculateCPC(double campaignSpend, long linkClicks) {
        if (linkClicks <= 0 || campaignSpend < 0) return 0.0;
        double cpc = campaignSpend / linkClicks;
        return roundToTwoDecimals(cpc);
    }

    /**
     * Conversion Rate = Conversions / Link Clicks * 100
     */
    public double calculateConversionRate(long conversions, long linkClicks) {
        if (linkClicks <= 0) return 0.0;
        double convRate = ((double) conversions / linkClicks) * 100.0;
        return roundToTwoDecimals(convRate);
    }

    /**
     * ROAS = Revenue / Campaign Spend
     */
    public double calculateROAS(double revenue, double campaignSpend) {
        if (campaignSpend <= 0 || revenue < 0) return 0.0;
        double roas = revenue / campaignSpend;
        return roundToTwoDecimals(roas);
    }

    /**
     * Influencer CPE = Influencer Cost / Engagements
     */
    public double calculateInfluencerCPE(double cost, long engagements) {
        if (engagements <= 0 || cost < 0) return 0.0;
        return roundToTwoDecimals(cost / engagements);
    }

    /**
     * Influencer ROI = ((Conversions Value / Cost) or Conversions / Cost ratio) * 100
     */
    public double calculateInfluencerROI(double cost, long conversions, double estimatedValuePerConversion) {
        if (cost <= 0) return 0.0;
        double revenueGenerated = conversions * estimatedValuePerConversion;
        double roi = ((revenueGenerated - cost) / cost) * 100.0;
        return roundToTwoDecimals(roi);
    }

    public double roundToTwoDecimals(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) {
            return 0.0;
        }
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
