package com.dev.sports_club.controller;

import com.dev.sports_club.entity.AuditAction;
import com.dev.sports_club.report.ReportData;
import com.dev.sports_club.report.ReportExporter;
import com.dev.sports_club.service.AuditService;
import com.dev.sports_club.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService service;
    private final AuditService audit;

    /** json returns the data (optionally limited, for a preview); csv, xlsx and pdf download a file. */
    @GetMapping("/{type}")
    public ResponseEntity<?> report(
            @PathVariable String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Integer teamId,
            @RequestParam(defaultValue = "json") String format,
            @RequestParam(required = false) Integer limit) throws IOException {

        if (ReportService.known(type) && !ReportService.allowed(type, roles())) {
            throw new AccessDeniedException("Your role cannot run this report");
        }
        ReportData report = service.build(type, from, to, teamId);

        if ("json".equals(format)) {
            if (limit != null && limit >= 0 && limit < report.rows().size()) {
                // Keep the full row count visible to the caller while returning only a preview.
                return ResponseEntity.ok()
                        .header("X-Total-Rows", String.valueOf(report.rows().size()))
                        .body(new ReportData(report.type(), report.title(), report.organization(), report.from(), report.to(),
                                report.generatedAt(), report.summary(), report.columns(), report.rows().subList(0, limit)));
            }
            return ResponseEntity.ok().header("X-Total-Rows", String.valueOf(report.rows().size())).body(report);
        }

        byte[] body;
        MediaType mediaType;
        String extension;
        switch (format) {
            case "csv" -> { body = ReportExporter.csv(report); mediaType = MediaType.parseMediaType("text/csv;charset=UTF-8"); extension = "csv"; }
            case "xlsx" -> { body = ReportExporter.xlsx(report); mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); extension = "xlsx"; }
            case "pdf" -> { body = ReportExporter.pdf(report); mediaType = MediaType.APPLICATION_PDF; extension = "pdf"; }
            default -> throw new com.dev.sports_club.exception.BusinessRuleViolationException("Unknown format: " + format);
        }
        audit.record(AuditAction.EXPORT, "report", type, "Exported " + report.title() + " as " + extension.toUpperCase() + " (" + report.from() + " to " + report.to() + ", " + report.rows().size() + " rows)");
        String filename = type + "-report-" + report.from() + "_" + report.to() + "." + extension;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .header("X-Total-Rows", String.valueOf(report.rows().size()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(body);
    }

    private List<String> roles() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).map(a -> a.replace("ROLE_", "")).collect(Collectors.toList());
    }
}
