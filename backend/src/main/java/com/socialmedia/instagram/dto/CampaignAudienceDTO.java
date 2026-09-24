package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignAudienceDTO {
    private Map<String, Double> ageGroups;
    private Map<String, Double> genderDistribution;
    private Map<String, Double> topCountries;
    private Map<String, Double> topCities;
    private List<String> interests;
    private Long followerReach;
    private Long nonFollowerReach;
}
