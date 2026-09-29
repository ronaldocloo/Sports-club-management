package com.dev.sports_club.unit;

import com.dev.sports_club.security.RateLimiter;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimiterTest {

    @Test
    void allowsUpToTheLimitThenBlocks() {
        RateLimiter limiter = new RateLimiter(3, 60_000);
        assertThat(limiter.tryAcquire("a", 0)).isZero();
        assertThat(limiter.tryAcquire("a", 1)).isZero();
        assertThat(limiter.tryAcquire("a", 2)).isZero();
        assertThat(limiter.tryAcquire("a", 3)).isPositive();
    }

    @Test
    void reportsHowLongToWait() {
        RateLimiter limiter = new RateLimiter(1, 10_000);
        limiter.tryAcquire("a", 1_000);
        assertThat(limiter.tryAcquire("a", 4_000)).isEqualTo(7_000);
    }

    @Test
    void windowSlides() {
        RateLimiter limiter = new RateLimiter(2, 1_000);
        limiter.tryAcquire("a", 0);
        limiter.tryAcquire("a", 500);
        assertThat(limiter.tryAcquire("a", 900)).isPositive();
        assertThat(limiter.tryAcquire("a", 1_100)).isZero(); // the hit at t=0 has expired
    }

    @Test
    void keysAreIndependent() {
        RateLimiter limiter = new RateLimiter(1, 60_000);
        assertThat(limiter.tryAcquire("a", 0)).isZero();
        assertThat(limiter.tryAcquire("b", 0)).isZero();
        assertThat(limiter.tryAcquire("a", 1)).isPositive();
    }

    @Test
    void pruneDropsIdleKeys() {
        RateLimiter limiter = new RateLimiter(1, 1_000);
        limiter.tryAcquire("a", 0);
        limiter.prune(5_000);
        assertThat(limiter.tryAcquire("a", 5_001)).isZero();
    }
}
