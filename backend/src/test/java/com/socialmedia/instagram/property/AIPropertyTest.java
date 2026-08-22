package com.socialmedia.instagram.property;

import net.jqwik.api.*;
import net.jqwik.api.constraints.*;

public class AIPropertyTest {

    @Property(tries = 100)
    void accountHealthScoreIsWithinBounds(
        @ForAll @DoubleRange(min = 0.0, max = 20.0) double avgEr,
        @ForAll @IntRange(min = 0, max = 200) int reelsCount,
        @ForAll @IntRange(min = 0, max = 500) int postsCount
    ) {
        double reelRatio = reelsCount / (double) Math.max(1, postsCount + reelsCount);
        int healthScore = (int) Math.min(100, Math.max(30, (avgEr * 15) + (reelRatio * 20) + 35));

        assert healthScore >= 30 && healthScore <= 100;
    }

    @Property(tries = 100)
    void hashtagRelevanceScoreIsPercentage(
        @ForAll @IntRange(min = 0, max = 30) int tagCount
    ) {
        double score = Math.min(100.0, tagCount * 8.5 + 20);
        assert score >= 0.0 && score <= 100.0;
    }
}
