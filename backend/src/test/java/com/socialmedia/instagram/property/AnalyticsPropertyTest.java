package com.socialmedia.instagram.property;

import net.jqwik.api.*;
import net.jqwik.api.constraints.*;

public class AnalyticsPropertyTest {

    @Property(tries = 100)
    void engagementRateIsNonNegative(
        @ForAll @IntRange(min = 0, max = 100000) int likes,
        @ForAll @IntRange(min = 0, max = 10000) int comments,
        @ForAll @IntRange(min = 0, max = 5000) int shares,
        @ForAll @IntRange(min = 0, max = 5000) int saves,
        @ForAll @IntRange(min = 100, max = 1000000) int followers
    ) {
        long totalInteractions = (long) likes + comments + shares + saves;
        double er = ((double) totalInteractions / followers) * 100.0;
        
        assert er >= 0.0;
        assert !Double.isNaN(er);
        assert !Double.isInfinite(er);
    }

    @Property(tries = 100)
    void weightedContentScoreIsBounded(
        @ForAll @IntRange(min = 0, max = 50000) int likes,
        @ForAll @IntRange(min = 0, max = 5000) int comments,
        @ForAll @IntRange(min = 0, max = 2000) int shares,
        @ForAll @IntRange(min = 0, max = 3000) int saves,
        @ForAll @DoubleRange(min = 0.0, max = 1.0) double likeWeight,
        @ForAll @DoubleRange(min = 0.0, max = 1.0) double commentWeight
    ) {
        double score = (likes * likeWeight) + (comments * commentWeight);
        assert score >= 0.0;
    }

    @Property(tries = 100)
    void netGrowthCalculationIsConsistent(
        @ForAll @IntRange(min = 0, max = 1000) int gained,
        @ForAll @IntRange(min = 0, max = 1000) int lost
    ) {
        int net = gained - lost;
        assert (net >= 0) == (gained >= lost);
    }
}
