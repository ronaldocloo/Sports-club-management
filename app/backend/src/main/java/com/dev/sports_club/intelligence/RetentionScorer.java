package com.dev.sports_club.intelligence;

import java.util.ArrayList;
import java.util.List;

/**
 * Scores how likely an athlete is to lapse (not renew, or drift away) from 0 (safe) to 100 (very likely).
 * The score is a plain sum of named factors, so every point can be explained to the person reviewing it.
 * It is a prompt for a human to follow up, never an automatic decision.
 */
public final class RetentionScorer {

    public record Input(
            Long daysToMembershipEnd,      // null when the athlete has no membership at all; negative when it has ended
            boolean membershipActive,
            Double recentAttendance,       // percent, null when no attendance is recorded
            Double earlierAttendance,      // percent, null when there is too little history to compare
            boolean noRecentAttendance,    // teammates trained in the last 30 days but this athlete did not attend
            double outstandingBalance,
            long membershipAgeDays,
            boolean hasRenewedBefore) { }

    public record Factor(String label, int points) { }

    public record Result(int score, String band, List<Factor> factors, String action) { }

    private RetentionScorer() { }

    public static Result score(Input in) {
        List<Factor> factors = new ArrayList<>();

        // Membership status is the strongest signal.
        if (in.daysToMembershipEnd() == null) {
            factors.add(new Factor("No membership on record", 35));
        } else if (in.daysToMembershipEnd() < 0) {
            factors.add(new Factor("Membership ended " + (-in.daysToMembershipEnd()) + " days ago and has not been renewed", 40));
        } else if (in.membershipActive()) {
            long d = in.daysToMembershipEnd();
            if (d <= 14) factors.add(new Factor("Membership ends in " + d + (d == 1 ? " day" : " days"), 30));
            else if (d <= 30) factors.add(new Factor("Membership ends in " + d + " days", 20));
            else if (d <= 60) factors.add(new Factor("Membership ends in " + d + " days", 10));
        }

        // Attendance level and direction.
        if (in.recentAttendance() != null) {
            double r = in.recentAttendance();
            if (r < 50) factors.add(new Factor("Recent attendance is only " + Math.round(r) + "%", 25));
            else if (r < 70) factors.add(new Factor("Recent attendance is " + Math.round(r) + "%", 15));
            else if (r < 85) factors.add(new Factor("Recent attendance is " + Math.round(r) + "%", 5));
            if (in.earlierAttendance() != null && in.earlierAttendance() - r >= 15) {
                factors.add(new Factor("Attendance fell " + Math.round(in.earlierAttendance() - r) + " points", 15));
            }
        }
        if (in.noRecentAttendance()) factors.add(new Factor("Has not attended in the last 30 days", 10));

        // Money owed on an established membership.
        if (in.outstandingBalance() > 0 && in.membershipAgeDays() > 30) {
            factors.add(new Factor("Owes GH₵" + Math.round(in.outstandingBalance()), in.outstandingBalance() > 100 ? 15 : 10));
        }

        // Loyalty pulls the score down.
        if (in.hasRenewedBefore()) factors.add(new Factor("Has renewed before", -15));
        if (in.membershipAgeDays() >= 365) factors.add(new Factor("Member for over a year", -5));

        int total = Math.max(0, Math.min(100, factors.stream().mapToInt(Factor::points).sum()));
        String band = total >= 60 ? "High" : total >= 35 ? "Medium" : "Low";
        return new Result(total, band, factors, action(in, factors));
    }

    private static String action(Input in, List<Factor> factors) {
        Factor top = factors.stream().filter(f -> f.points() > 0).max(java.util.Comparator.comparingInt(Factor::points)).orElse(null);
        if (top == null) return "No action needed";
        String label = top.label();
        if (label.startsWith("No membership") || label.contains("membership") || label.startsWith("Membership")) return "Offer a membership or send a renewal reminder";
        if (label.contains("attend")) return "Check in with the athlete about training";
        if (label.startsWith("Owes")) return "Follow up on the unpaid balance";
        return "Review this athlete";
    }
}
