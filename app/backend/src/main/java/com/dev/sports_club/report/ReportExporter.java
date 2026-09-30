package com.dev.sports_club.report;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Renders a {@link ReportData} as CSV, a real .xlsx workbook, or a PDF. */
public final class ReportExporter {

    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm");

    private ReportExporter() { }

    // ---------------------------------------------------------------- CSV
    public static byte[] csv(ReportData r) {
        StringBuilder sb = new StringBuilder("﻿");
        sb.append(line(r.columns().stream().map(c -> (Object) c).toList()));
        r.rows().forEach(row -> sb.append(line(row)));
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static String line(List<Object> cells) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(csvCell(cells.get(i)));
        }
        return sb.append("\r\n").toString();
    }

    private static String csvCell(Object value) {
        String s = value == null ? "" : String.valueOf(value);
        // A cell starting with = + - @ would be run as a formula by a spreadsheet; neutralise it.
        if (!s.isEmpty() && "=+-@".indexOf(s.charAt(0)) >= 0 && !(value instanceof Number)) s = "'" + s;
        return s.contains(",") || s.contains("\"") || s.contains("\n") ? "\"" + s.replace("\"", "\"\"") + "\"" : s;
    }

    // ---------------------------------------------------------------- XLSX
    public static byte[] xlsx(ReportData r) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet(safeSheetName(r.title()));
            XSSFFont bold = wb.createFont();
            bold.setBold(true);
            XSSFFont title = wb.createFont();
            title.setBold(true);
            title.setFontHeightInPoints((short) 14);
            CellStyle titleStyle = wb.createCellStyle();
            titleStyle.setFont(title);
            CellStyle head = wb.createCellStyle();
            head.setFont(bold);
            head.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            head.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            head.setBorderBottom(BorderStyle.THIN);
            CellStyle boldStyle = wb.createCellStyle();
            boldStyle.setFont(bold);

            int rowNum = 0;
            text(sheet.createRow(rowNum++), 0, r.title(), titleStyle);
            text(sheet.createRow(rowNum++), 0, r.organization() + "  |  " + r.from() + " to " + r.to() + "  |  Generated " + STAMP.format(r.generatedAt()), null);
            rowNum++;
            for (ReportData.Stat s : r.summary()) {
                Row row = sheet.createRow(rowNum++);
                text(row, 0, s.label(), boldStyle);
                text(row, 1, s.value(), null);
            }
            if (!r.summary().isEmpty()) rowNum++;

            int headerRow = rowNum;
            Row header = sheet.createRow(rowNum++);
            for (int c = 0; c < r.columns().size(); c++) text(header, c, r.columns().get(c), head);
            for (List<Object> values : r.rows()) {
                Row row = sheet.createRow(rowNum++);
                for (int c = 0; c < values.size(); c++) {
                    Object v = values.get(c);
                    Cell cell = row.createCell(c);
                    if (v instanceof Number n) cell.setCellValue(n.doubleValue());
                    else cell.setCellValue(v == null ? "" : String.valueOf(v));
                }
            }
            sheet.createFreezePane(0, headerRow + 1);
            for (int c = 0; c < r.columns().size(); c++) {
                sheet.autoSizeColumn(c);
                sheet.setColumnWidth(c, Math.min(sheet.getColumnWidth(c) + 512, 60 * 256));
            }
            wb.write(out);
            return out.toByteArray();
        }
    }

    private static void text(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        if (style != null) cell.setCellStyle(style);
    }

    private static String safeSheetName(String name) {
        String n = name.replaceAll("[\\\\/?*\\[\\]:]", " ").trim();
        return n.length() > 31 ? n.substring(0, 31) : n;
    }

    // ---------------------------------------------------------------- PDF
    public static byte[] pdf(ReportData r) {
        boolean wide = r.columns().size() > 6;
        Document doc = new Document(wide ? PageSize.A4.rotate() : PageSize.A4, 36, 36, 40, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font h1 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Font muted = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);
        Font label = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);
        Font value = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        Font th = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
        Font td = FontFactory.getFont(FontFactory.HELVETICA, 8);

        doc.add(new Paragraph(pdfText(r.title()), h1));
        doc.add(new Paragraph(pdfText(r.organization() + "  |  " + r.from() + " to " + r.to() + "  |  Generated " + STAMP.format(r.generatedAt())), muted));
        doc.add(new Paragraph(" "));

        if (!r.summary().isEmpty()) {
            PdfPTable stats = new PdfPTable(Math.min(r.summary().size(), 4));
            stats.setWidthPercentage(100);
            for (ReportData.Stat s : r.summary()) {
                PdfPCell cell = new PdfPCell();
                cell.setBorder(Rectangle.NO_BORDER);
                cell.setPaddingBottom(8);
                cell.addElement(new Paragraph(pdfText(s.value()), value));
                cell.addElement(new Paragraph(pdfText(s.label()), label));
                stats.addCell(cell);
            }
            stats.completeRow();
            doc.add(stats);
            doc.add(new Paragraph(" "));
        }

        if (r.rows().isEmpty()) {
            doc.add(new Paragraph("No records for this period.", muted));
        } else {
            PdfPTable table = new PdfPTable(r.columns().size());
            table.setWidthPercentage(100);
            table.setHeaderRows(1);
            for (String c : r.columns()) {
                PdfPCell cell = new PdfPCell(new Phrase(pdfText(c), th));
                cell.setBackgroundColor(new Color(0xF3, 0xF4, 0xF6));
                cell.setPadding(4);
                table.addCell(cell);
            }
            for (List<Object> row : r.rows()) {
                for (Object v : row) {
                    PdfPCell cell = new PdfPCell(new Phrase(pdfText(v == null ? "" : String.valueOf(v)), td));
                    cell.setPadding(3);
                    cell.setBorderColor(new Color(0xE5, 0xE7, 0xEB));
                    if (v instanceof Number) cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    table.addCell(cell);
                }
            }
            doc.add(table);
        }
        doc.add(new Paragraph(new Chunk(" ")));
        doc.close();
        return out.toByteArray();
    }

    /** The built-in PDF fonts have no cedi sign, so spell the currency out. */
    private static String pdfText(String s) {
        return s == null ? "" : s.replace("GH₵", "GHS ").replace("₵", "GHS ");
    }
}
