package com.dev.sports_club.report;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** A finished report: a title, headline figures, and a table. Every export format is rendered from this. */
public record ReportData(String type, String title, String organization, LocalDate from, LocalDate to, LocalDateTime generatedAt,
                         List<Stat> summary, List<String> columns, List<List<Object>> rows) {

    public record Stat(String label, String value) { }
}
