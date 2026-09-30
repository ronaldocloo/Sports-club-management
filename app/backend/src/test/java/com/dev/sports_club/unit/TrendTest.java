package com.dev.sports_club.unit;

import com.dev.sports_club.intelligence.Trend;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class TrendTest {

    @Test
    void perfectLineHasExactSlopeAndNoResidual() {
        Trend.Fit fit = Trend.linear(new double[]{10, 20, 30, 40});
        assertThat(fit.slope()).isCloseTo(10.0, within(1e-9));
        assertThat(fit.intercept()).isCloseTo(10.0, within(1e-9));
        assertThat(fit.residualStd()).isCloseTo(0.0, within(1e-9));
        assertThat(fit.predict(4)).isCloseTo(50.0, within(1e-9));
    }

    @Test
    void flatSeriesHasZeroSlope() {
        Trend.Fit fit = Trend.linear(new double[]{5, 5, 5, 5, 5});
        assertThat(fit.slope()).isZero();
        assertThat(fit.predict(10)).isCloseTo(5.0, within(1e-9));
    }

    @Test
    void decliningSeriesHasNegativeSlope() {
        assertThat(Trend.linear(new double[]{90, 80, 70, 60}).slope()).isLessThan(0);
    }

    @Test
    void noisyDataHasResidualSpread() {
        assertThat(Trend.linear(new double[]{10, 30, 20, 40, 30}).residualStd()).isGreaterThan(0);
    }

    @Test
    void tinyInputsDoNotBlowUp() {
        assertThat(Trend.linear(new double[]{}).n()).isZero();
        assertThat(Trend.linear(new double[]{7}).predict(3)).isEqualTo(7.0);
        assertThat(Trend.linear(new double[]{1, 2}).residualStd()).isZero();
    }

    @Test
    void meanAndStdDev() {
        assertThat(Trend.mean(new double[]{2, 4, 6})).isEqualTo(4.0);
        assertThat(Trend.stdDev(new double[]{2, 4, 4, 4, 5, 5, 7, 9})).isCloseTo(2.138, within(0.001));
        assertThat(Trend.stdDev(new double[]{5})).isZero();
    }
}
