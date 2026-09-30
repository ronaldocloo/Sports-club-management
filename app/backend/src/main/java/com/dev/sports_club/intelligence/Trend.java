package com.dev.sports_club.intelligence;

/** Least-squares straight-line fit, used for forecasts and trend detection. */
public final class Trend {

    /** y = intercept + slope * x with x = 0, 1, 2 ...; residualStd measures how far points sit from the line. */
    public record Fit(double slope, double intercept, double residualStd, int n) {
        public double predict(double x) { return intercept + slope * x; }
    }

    private Trend() { }

    public static Fit linear(double[] y) {
        int n = y.length;
        if (n == 0) return new Fit(0, 0, 0, 0);
        if (n == 1) return new Fit(0, y[0], 0, 1);
        double sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (int i = 0; i < n; i++) {
            sumX += i;
            sumY += y[i];
            sumXY += i * y[i];
            sumXX += (double) i * i;
        }
        double denom = n * sumXX - sumX * sumX;
        double slope = denom == 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
        double intercept = (sumY - slope * sumX) / n;
        double sse = 0;
        for (int i = 0; i < n; i++) {
            double r = y[i] - (intercept + slope * i);
            sse += r * r;
        }
        double std = n > 2 ? Math.sqrt(sse / (n - 2)) : 0;
        return new Fit(slope, intercept, std, n);
    }

    public static double mean(double[] v) {
        if (v.length == 0) return 0;
        double s = 0;
        for (double d : v) s += d;
        return s / v.length;
    }

    public static double stdDev(double[] v) {
        if (v.length < 2) return 0;
        double m = mean(v);
        double s = 0;
        for (double d : v) s += (d - m) * (d - m);
        return Math.sqrt(s / (v.length - 1));
    }
}
