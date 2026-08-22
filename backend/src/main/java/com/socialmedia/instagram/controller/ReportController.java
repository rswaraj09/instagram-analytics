package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.service.ExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ExportService exportService;

    @GetMapping("/generate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> generateReport(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(defaultValue = "WEEKLY") String reportType,
        @RequestParam(defaultValue = "PDF") String format
    ) {
        String title = reportType + " Instagram Intelligence Report";
        Map<String, Object> reportMeta = Map.of(
            "id", UUID.randomUUID(),
            "title", title,
            "type", reportType,
            "format", format,
            "createdAt", new Date().toString(),
            "status", "READY",
            "summary", "Comprehensive analytics report containing engagement metrics, top posts, growth breakdown, competitor comparisons, and AI recommendations."
        );
        return ResponseEntity.ok(reportMeta);
    }

    @GetMapping("/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadReport(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(defaultValue = "WEEKLY") String reportType,
        @RequestParam(defaultValue = "CSV") String format
    ) {
        if ("PDF".equalsIgnoreCase(format)) {
            byte[] pdfBytes = exportService.generatePdf(List.of());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "instagram-report.pdf");
            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } else if ("EXCEL".equalsIgnoreCase(format)) {
            byte[] excelBytes = exportService.generateExcel(List.of());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "instagram-report.xlsx");
            return ResponseEntity.ok().headers(headers).body(excelBytes);
        } else {
            String csvText = "Report Title,Generated Date,Followers,Engagement Rate,Top Post,Best Reel Views\n" +
                reportType + " Report," + new Date() + ",14500,3.42%,ig_1001,48500\n";
            byte[] csvBytes = csvText.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "instagram-report.csv");
            return ResponseEntity.ok().headers(headers).body(csvBytes);
        }
    }
}
