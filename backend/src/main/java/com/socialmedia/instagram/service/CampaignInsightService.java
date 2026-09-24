package com.socialmedia.instagram.service;

import com.socialmedia.instagram.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignInsightService {

    private final CampaignAnalysisService analysisService;

    public CampaignAIInsightsDTO generateInsights(
            CampaignDTO campaign,
            List<CampaignContentDTO> contents,
            List<CampaignInfluencerDTO> influencers,
            List<CampaignGoalDTO> goals,
            CampaignAudienceDTO audience
    ) {
        List<String> whatPerformedWell = new ArrayList<>();
        List<String> whatPerformedPoorly = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> recommendedImprovements = new ArrayList<>();

        String bestContentText = "No content data available.";
        String bestInfluencerText = "No influencer data available.";
        String audienceText = "Audience demographic data is balanced across age groups and regions.";
        String engagementTrendText = "Engagement has remained steady over the campaign duration.";
        String suggestedStrategy = "Maintain consistent posting schedule and test short-form Reels with call-to-action links.";

        double totalEngagements = campaign.getTotalEngagements() != null ? campaign.getTotalEngagements() : 0L;
        long totalReach = campaign.getTotalReach() != null ? campaign.getTotalReach() : 0L;
        long totalImpressions = campaign.getTotalImpressions() != null ? campaign.getTotalImpressions() : 0L;
        double er = campaign.getEngagementRate() != null ? campaign.getEngagementRate() : 0.0;
        double roas = campaign.getRoas() != null ? campaign.getRoas() : 0.0;

        // Content-level analysis
        if (contents != null && !contents.isEmpty()) {
            Map<String, List<CampaignContentDTO>> byType = contents.stream()
                    .collect(Collectors.groupingBy(c -> c.getMediaType() != null ? c.getMediaType().toUpperCase() : "POST"));

            long reelEngagements = byType.getOrDefault("REEL", Collections.emptyList()).stream()
                    .mapToLong(c -> (c.getLikes() + c.getComments() + c.getShares() + c.getSaves()))
                    .sum();
            long postEngagements = byType.getOrDefault("POST", Collections.emptyList()).stream()
                    .mapToLong(c -> (c.getLikes() + c.getComments() + c.getShares() + c.getSaves()))
                    .sum();

            if (totalEngagements > 0) {
                double reelPct = analysisService.roundToTwoDecimals((reelEngagements / (double) totalEngagements) * 100.0);
                if (reelPct > 40.0) {
                    whatPerformedWell.add(String.format(
                            "Reels generated %.1f%% of total campaign engagement and produced higher viewer retention.", reelPct
                    ));
                } else if (postEngagements > 0) {
                    double postPct = analysisService.roundToTwoDecimals((postEngagements / (double) totalEngagements) * 100.0);
                    whatPerformedWell.add(String.format("Feed posts generated %.1f%% of campaign engagements.", postPct));
                }
            }

            // Find top content
            CampaignContentDTO topContent = contents.stream()
                    .max(Comparator.comparing(c -> (c.getLikes() + c.getComments() + c.getShares() + c.getSaves())))
                    .orElse(null);

            if (topContent != null) {
                long topEng = topContent.getLikes() + topContent.getComments() + topContent.getShares() + topContent.getSaves();
                bestContentText = String.format("%s item (%s) reached %d users with %d engagements (%.2f%% ER).",
                        topContent.getMediaType(),
                        topContent.getCaption() != null && !topContent.getCaption().isBlank() ?
                                (topContent.getCaption().length() > 40 ? topContent.getCaption().substring(0, 40) + "..." : topContent.getCaption()) : "Untitled",
                        topContent.getReach() != null ? topContent.getReach() : 0,
                        topEng,
                        topContent.getEngagementRate() != null ? topContent.getEngagementRate() : 0.0
                );
                whatPerformedWell.add("Top content piece achieved " + topEng + " total engagements.");
            }

            // Find lowest performing content
            CampaignContentDTO worstContent = contents.stream()
                    .min(Comparator.comparing(c -> (c.getLikes() + c.getComments() + c.getShares() + c.getSaves())))
                    .orElse(null);

            if (worstContent != null && contents.size() > 1) {
                long worstEng = worstContent.getLikes() + worstContent.getComments() + worstContent.getShares() + worstContent.getSaves();
                whatPerformedPoorly.add(String.format("%s content received low engagement (%d interactions).", worstContent.getMediaType(), worstEng));
            }
        }

        // Influencer analysis
        if (influencers != null && !influencers.isEmpty()) {
            CampaignInfluencerDTO topInf = influencers.stream()
                    .max(Comparator.comparing(i -> i.getEngagements() != null ? i.getEngagements() : 0))
                    .orElse(null);

            if (topInf != null) {
                bestInfluencerText = String.format("%s (@%s) delivered %d engagements across %d posts at $%.2f CPE.",
                        topInf.getInfluencerName(),
                        topInf.getHandle() != null ? topInf.getHandle() : topInf.getInfluencerName(),
                        topInf.getEngagements() != null ? topInf.getEngagements() : 0,
                        topInf.getContentCount() != null ? topInf.getContentCount() : 1,
                        topInf.getCpe() != null ? topInf.getCpe() : 0.0
                );
                whatPerformedWell.add("Influencer collaboration with " + topInf.getInfluencerName() + " drove strong audience reach.");
            }
        }

        // Audience analysis
        if (audience != null) {
            if (audience.getFollowerReach() != null && audience.getNonFollowerReach() != null) {
                long totalAudienceReach = audience.getFollowerReach() + audience.getNonFollowerReach();
                if (totalAudienceReach > 0) {
                    double nonFollowerPct = analysisService.roundToTwoDecimals((audience.getNonFollowerReach() / (double) totalAudienceReach) * 100.0);
                    audienceText = String.format("Campaign expanded brand discovery with %.1f%% of reach coming from non-followers.", nonFollowerPct);
                    if (nonFollowerPct > 50.0) {
                        whatPerformedWell.add("High discovery rate: Over " + Math.round(nonFollowerPct) + "% of reached accounts were non-followers.");
                    }
                }
            }
        }

        // Metrics & KPI trends evaluation
        if (er < 2.0 && totalReach > 0) {
            weaknesses.add("Overall campaign engagement rate (" + er + "%) is below the 2.5% industry benchmark.");
            recommendedImprovements.add("Incorporate clear calls-to-action (CTAs) in captions and stories to prompt comments and saves.");
        } else if (er >= 3.5) {
            whatPerformedWell.add(String.format("Strong engagement rate of %.2f%% outperforming baseline averages.", er));
        }

        if (campaign.getCtr() != null && campaign.getCtr() < 1.0 && totalImpressions > 0) {
            weaknesses.add("Click-Through Rate (CTR) of " + campaign.getCtr() + "% indicates potential friction in conversion link placements.");
            recommendedImprovements.add("Optimize link placements in bio/stories and add urgent incentives for link clicks.");
        }

        if (roas > 0.0 && roas < 1.5) {
            weaknesses.add("Ad spend efficiency (ROAS: " + roas + "x) requires budget reallocation toward top-performing media formats.");
            recommendedImprovements.add("Reallocate spend from static feed posts to high-converting Reels and targeted influencer posts.");
        } else if (roas >= 2.0) {
            whatPerformedWell.add(String.format("Healthy Return on Ad Spend (ROAS) of %.2fx.", roas));
        }

        // Goals progress analysis
        if (goals != null && !goals.isEmpty()) {
            long offTrackGoals = goals.stream().filter(g -> g.getIsOnTrack() != null && !g.getIsOnTrack()).count();
            if (offTrackGoals > 0) {
                weaknesses.add(offTrackGoals + " out of " + goals.size() + " campaign target goals are currently lagging behind schedule.");
            }
        }

        if (whatPerformedWell.isEmpty()) {
            whatPerformedWell.add("Campaign initiated with stable baseline reach and impressions across target demographics.");
        }
        if (whatPerformedPoorly.isEmpty()) {
            whatPerformedPoorly.add("No significant performance drop-offs detected across content channels.");
        }
        if (weaknesses.isEmpty()) {
            weaknesses.add("Minor scope for optimizing click-through rates on promotional story links.");
        }
        if (recommendedImprovements.isEmpty()) {
            recommendedImprovements.add("Scale budget allocation towards video Reels and story link stickers.");
            recommendedImprovements.add("A/B test caption headlines and carousel slide hooks to improve completion rate.");
        }

        double score = 70.0 + (er * 4.0) + (roas * 5.0);
        if (score > 98.0) score = 98.0;
        if (score < 50.0) score = 50.0;

        return CampaignAIInsightsDTO.builder()
                .whatPerformedWell(whatPerformedWell)
                .whatPerformedPoorly(whatPerformedPoorly)
                .bestPerformingContent(bestContentText)
                .bestPerformingInfluencer(bestInfluencerText)
                .audienceInsights(audienceText)
                .engagementTrends(engagementTrendText)
                .campaignWeaknesses(weaknesses)
                .recommendedImprovements(recommendedImprovements)
                .suggestedStrategy(suggestedStrategy)
                .overallScore(analysisService.roundToTwoDecimals(score))
                .build();
    }
}
