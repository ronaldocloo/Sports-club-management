package com.dev.sports_club.dto;

import java.util.List;

/** Response shapes for the intelligence endpoints. */
public final class IntelligenceResponses {

    private IntelligenceResponses() { }

    public record RetentionRisk(Integer athleteId, String name, String sport, int score, String band, String action,
                                List<Factor> factors, boolean hasAccount) { }

    public record Factor(String label, int points) { }

    public record RetentionOverview(List<RetentionRisk> athletes, int high, int medium, int low, String method) { }

    public record MonthValue(String month, double value) { }

    public record ForecastPoint(String month, double expected, double low, double high) { }

    public record Pipeline(int membershipsEnding, double amountEnding, double renewalProbability, double expectedRenewals, double atRisk) { }

    public record RevenueForecast(List<MonthValue> history, List<ForecastPoint> forecast, Double monthlyChange, String method,
                                  Pipeline pipeline, String note) { }

    public record TeamOutlook(Integer teamId, String team, Double currentRate, Double previousRate, Double projectedRate, String status) { }

    public record SlotDemand(String day, String slot, double predictedBookings, double perFacility) { }

    public record FacilityDemand(List<String> days, List<String> slots, double[][] predicted, List<SlotDemand> peaks,
                                 List<SlotDemand> quiet, List<String> recommendations, int weeksAnalysed, int openFacilities) { }

    public record Anomaly(String severity, String type, String title, String detail, String link) { }

    public record AthleteInsight(Integer athleteId, String performanceTrend, Double ratingChangePct, Double latestRating,
                                 Double teamAverage, Double consistency, String attendanceTrend, List<String> highlights) { }
}
