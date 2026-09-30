package com.dev.sports_club.dto;

import java.time.LocalDate;
import java.util.List;

/** Everything the Analytics page and the dashboard need for one date range. */
public record AnalyticsOverviewResponse(
        Period period,
        Period previous,
        Kpis kpis,
        List<MonthPoint> revenueByMonth,
        List<MonthPoint> athleteGrowth,
        List<MonthPoint> attendanceByMonth,
        List<Slice> membershipStatus,
        List<Slice> sports,
        List<Slice> gender,
        List<Slice> ageBands,
        List<Slice> paymentMethods,
        List<Slice> plans,
        List<FacilityUse> facilities,
        Heatmap heatmap,
        List<TeamRow> teams,
        List<Insight> insights,
        List<Attention> attention,
        Outstanding outstanding) {

    public record Period(LocalDate from, LocalDate to) { }

    /** A value for the period, the same measure for the previous period, and the change between them. */
    public record Metric(double value, double previous, Double changePct) { }

    public record Kpis(Metric revenue, Metric newAthletes, Metric activeMemberships, Metric renewalRate,
                       Metric attendanceRate, Metric facilityUtilization, Metric fixturesPlayed) { }

    public record MonthPoint(String month, double value) { }

    public record Slice(String name, double value) { }

    public record FacilityUse(Integer facilityId, String name, String type, String status, int bookings, double utilization) { }

    public record Heatmap(List<String> days, List<String> slots, int[][] grid) { }

    public record TeamRow(Integer teamId, String name, String sport, int athletes, int played, int won, int drawn, int lost,
                          int points, Double attendanceRate, Double averageRating) { }

    public record Insight(String severity, String title, String text, String link) { }

    public record Attention(Integer athleteId, String name, String sport, List<String> reasons) { }

    public record Outstanding(double amount, int memberships) { }
}
