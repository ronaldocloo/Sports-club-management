package com.dev.sports_club.unit;

import com.dev.sports_club.intelligence.RetentionScorer;
import com.dev.sports_club.intelligence.RetentionScorer.Input;
import com.dev.sports_club.intelligence.RetentionScorer.Result;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RetentionScorerTest {

    private static Input healthy() {
        return new Input(200L, true, 95.0, 92.0, false, 0, 400, true);
    }

    @Test
    void healthyLoyalMemberScoresLowAndNeedsNoAction() {
        Result r = RetentionScorer.score(healthy());
        assertThat(r.score()).isZero();
        assertThat(r.band()).isEqualTo("Low");
        assertThat(r.action()).isEqualTo("No action needed");
    }

    @Test
    void endedMembershipIsHighestSingleSignal() {
        Result r = RetentionScorer.score(new Input(-45L, false, null, null, false, 0, 100, false));
        assertThat(r.score()).isEqualTo(40);
        assertThat(r.band()).isEqualTo("Medium");
        assertThat(r.factors().get(0).label()).contains("ended 45 days ago");
    }

    @Test
    void noMembershipScoresAsMedium() {
        assertThat(RetentionScorer.score(new Input(null, false, null, null, false, 0, 0, false)).score()).isEqualTo(35);
    }

    @Test
    void closerExpiryScoresHigher() {
        int week = RetentionScorer.score(new Input(7L, true, null, null, false, 0, 100, false)).score();
        int month = RetentionScorer.score(new Input(25L, true, null, null, false, 0, 100, false)).score();
        int quarter = RetentionScorer.score(new Input(50L, true, null, null, false, 0, 100, false)).score();
        int far = RetentionScorer.score(new Input(120L, true, null, null, false, 0, 100, false)).score();
        assertThat(week).isGreaterThan(month);
        assertThat(month).isGreaterThan(quarter);
        assertThat(quarter).isGreaterThan(far);
        assertThat(far).isZero();
    }

    @Test
    void lowAndFallingAttendanceStacks() {
        Result r = RetentionScorer.score(new Input(100L, true, 40.0, 80.0, true, 0, 100, false));
        // 25 (under 50%) + 15 (fell 40 points) + 10 (no recent attendance)
        assertThat(r.score()).isEqualTo(50);
        assertThat(r.factors()).extracting(RetentionScorer.Factor::points).containsExactly(25, 15, 10);
        assertThat(r.action()).isEqualTo("Check in with the athlete about training");
    }

    @Test
    void balanceOnlyCountsOnEstablishedMemberships() {
        assertThat(RetentionScorer.score(new Input(100L, true, null, null, false, 60, 10, false)).score()).isZero();
        assertThat(RetentionScorer.score(new Input(100L, true, null, null, false, 60, 60, false)).score()).isEqualTo(10);
        assertThat(RetentionScorer.score(new Input(100L, true, null, null, false, 250, 60, false)).score()).isEqualTo(15);
    }

    @Test
    void loyaltyLowersButNeverBelowZero() {
        Result r = RetentionScorer.score(new Input(10L, true, null, null, false, 0, 400, true));
        assertThat(r.score()).isEqualTo(30 - 15 - 5);
        assertThat(RetentionScorer.score(new Input(200L, true, 100.0, 100.0, false, 0, 800, true)).score()).isZero();
    }

    @Test
    void scoreIsCappedAt100AndHighBandStartsAt60() {
        Result worst = RetentionScorer.score(new Input(-10L, false, 10.0, 90.0, true, 500, 90, false));
        assertThat(worst.score()).isLessThanOrEqualTo(100);
        assertThat(worst.band()).isEqualTo("High");
    }

    @Test
    void bandBoundaries() {
        // 30 (ends in 5 days) + 25 (attendance under 50%) = 55 -> Medium
        Result medium = RetentionScorer.score(new Input(5L, true, 45.0, null, false, 0, 100, false));
        assertThat(medium.score()).isEqualTo(55);
        assertThat(medium.band()).isEqualTo("Medium");
        // adding "no recent attendance" (+10) = 65 -> High
        Result high = RetentionScorer.score(new Input(5L, true, 45.0, null, true, 0, 100, false));
        assertThat(high.score()).isEqualTo(65);
        assertThat(high.band()).isEqualTo("High");
        // exactly 35 is the first Medium score, 20 stays Low
        assertThat(RetentionScorer.score(new Input(null, false, null, null, false, 0, 0, false)).band()).isEqualTo("Medium");
        assertThat(RetentionScorer.score(new Input(25L, true, null, null, false, 0, 100, false)).band()).isEqualTo("Low");
    }

    @Test
    void everyPointIsExplainedByAFactor() {
        Result r = RetentionScorer.score(new Input(10L, true, 60.0, 80.0, true, 120, 200, false));
        assertThat(r.factors().stream().mapToInt(RetentionScorer.Factor::points).sum()).isEqualTo(r.score());
    }
}
