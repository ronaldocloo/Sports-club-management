package com.dev.sports_club.unit;

import com.dev.sports_club.report.ReportData;
import com.dev.sports_club.report.ReportExporter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ReportExporterTest {

    private static ReportData sample(List<List<Object>> rows) {
        return new ReportData("financial", "Financial report", "Test Club", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31), LocalDateTime.of(2026, 4, 1, 9, 0),
                List.of(new ReportData.Stat("Collected", "GH₵100.00")), List.of("ID", "Name", "Amount"), rows);
    }

    private static List<Object> row(Object... c) { return new ArrayList<>(Arrays.asList(c)); }

    @Test
    void csvHasBomHeaderAndRows() {
        String csv = new String(ReportExporter.csv(sample(List.of(row(1, "Ama", 50.5), row(2, "Kofi", 20)))), StandardCharsets.UTF_8);
        assertThat(csv).startsWith("﻿ID,Name,Amount\r\n").contains("1,Ama,50.5\r\n").contains("2,Kofi,20\r\n");
    }

    @Test
    void csvQuotesCommasQuotesAndNewlines() {
        String csv = new String(ReportExporter.csv(sample(List.of(row(1, "Smith, John \"JJ\"", 1), row(2, "line1\nline2", 2)))), StandardCharsets.UTF_8);
        assertThat(csv).contains("\"Smith, John \"\"JJ\"\"\"").contains("\"line1\nline2\"");
    }

    @Test
    void csvNeutralisesSpreadsheetFormulas() {
        String csv = new String(ReportExporter.csv(sample(List.of(row(1, "=HYPERLINK(\"http://evil\")", 1), row(2, "+1+1", 2), row(3, "-2", 3), row(4, "@SUM(A1)", 4)))), StandardCharsets.UTF_8);
        assertThat(csv).contains("'=HYPERLINK").contains("'+1+1").contains("'-2").contains("'@SUM");
    }

    @Test
    void negativeNumbersAreNotMangled() {
        String csv = new String(ReportExporter.csv(sample(List.of(row(1, "Refund", -25.5)))), StandardCharsets.UTF_8);
        assertThat(csv).contains("1,Refund,-25.5");
    }

    @Test
    void xlsxIsARealWorkbookWithNumericCells() throws Exception {
        byte[] bytes = ReportExporter.xlsx(sample(List.of(row(1, "Ama", 50.5), row(2, "Kofi", 20))));
        assertThat(bytes[0]).isEqualTo((byte) 'P');
        assertThat(bytes[1]).isEqualTo((byte) 'K');
        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            assertThat(sheet.getRow(0).getCell(0).getStringCellValue()).isEqualTo("Financial report");
            Row header = null;
            for (Row r : sheet) if (r.getCell(0) != null && "ID".equals(r.getCell(0).toString())) header = r;
            assertThat(header).isNotNull();
            Row first = sheet.getRow(header.getRowNum() + 1);
            assertThat(first.getCell(1).getStringCellValue()).isEqualTo("Ama");
            assertThat(first.getCell(2).getNumericCellValue()).isEqualTo(50.5);
        }
    }

    @Test
    void pdfIsAValidDocumentEvenWhenEmpty() {
        byte[] full = ReportExporter.pdf(sample(List.of(row(1, "Ama", 50.5))));
        byte[] empty = ReportExporter.pdf(sample(List.of()));
        assertThat(new String(full, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
        assertThat(new String(empty, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
        assertThat(new String(full, StandardCharsets.ISO_8859_1)).contains("%%EOF");
    }

    @Test
    void pdfHandlesTheCediSignAndWideTables() {
        List<String> cols = List.of("A", "B", "C", "D", "E", "F", "G", "H");
        ReportData wide = new ReportData("x", "Wide", "Club", LocalDate.now(), LocalDate.now(), LocalDateTime.now(), List.of(new ReportData.Stat("Total", "GH₵1,000.00")), cols,
                List.of(row(1, 2, 3, 4, 5, 6, 7, "GH₵8")));
        assertThat(ReportExporter.pdf(wide).length).isGreaterThan(500);
    }
}
