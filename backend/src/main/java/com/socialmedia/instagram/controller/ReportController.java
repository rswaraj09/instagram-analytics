package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.service.ExportService;
import com.socialmedia.instagram.service.InstagramAccountService;
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
    private final InstagramAccountService accountService;

    @GetMapping("/generate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> generateReport(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) UUID accountId,
        @RequestParam(defaultValue = "INDIVIDUAL") String reportScope, // INDIVIDUAL or MULTI_ACCOUNT
        @RequestParam(defaultValue = "WEEKLY") String reportType,
        @RequestParam(defaultValue = "PDF") String format
    ) {
        boolean isMulti = "MULTI_ACCOUNT".equalsIgnoreCase(reportScope) || (accountId == null && "MULTI_ACCOUNT".equalsIgnoreCase(reportScope));
        String title = isMulti
            ? "Multi-Account Portfolio Analytics Report"
            : "Instagram Account Performance Report";

        Map<String, Object> reportMeta = new LinkedHashMap<>();
        reportMeta.put("id", UUID.randomUUID());
        reportMeta.put("title", title);
        reportMeta.put("reportScope", isMulti ? "MULTI_ACCOUNT" : "INDIVIDUAL");
        reportMeta.put("reportType", reportType);
        reportMeta.put("format", format);
        reportMeta.put("createdAt", new Date().toString());
        reportMeta.put("status", "READY");

        if (isMulti) {
            var combined = accountService.getCombinedAnalytics(userId);
            reportMeta.put("summary", String.format(
                "Multi-Account Report aggregating %d Instagram accounts. Total reach: %d, Total followers: %d, Average ER: %.2f%%.",
                combined.totalAccounts(), combined.totalReach(), combined.totalFollowers(), combined.averageEngagementRate()
            ));
            reportMeta.put("sectionsIncluded", List.of(
                "Account Summary",
                "Account Comparison Matrix",
                "Growth Comparison",
                "Content Performance Breakdown",
                "Campaign Performance",
                "Audience Comparison",
                "AI Insights & Multi-Account Strategy"
            ));
        } else {
            reportMeta.put("summary", "Comprehensive single-account report containing engagement metrics, top posts, growth breakdown, and AI recommendations.");
            reportMeta.put("sectionsIncluded", List.of(
                "Overview Metrics",
                "Post & Reel Insights",
                "Audience Demographics",
                "Campaign Breakdown",
                "AI Recommendations"
            ));
        }

        return ResponseEntity.ok(reportMeta);
    }

    @GetMapping("/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadReport(
        @AuthenticationPrincipal UUID userId,
        @RequestParam(required = false) UUID accountId,
        @RequestParam(defaultValue = "INDIVIDUAL") String reportScope,
        @RequestParam(defaultValue = "WEEKLY") String reportType,
        @RequestParam(defaultValue = "CSV") String format
    ) {
        boolean isMulti = "MULTI_ACCOUNT".equalsIgnoreCase(reportScope);
        String filenamePrefix = isMulti ? "multi-account-report" : "instagram-account-report";

        if ("PDF".equalsIgnoreCase(format)) {
            byte[] pdfBytes = exportService.generatePdf(List.of());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filenamePrefix + ".pdf");
            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } else if ("EXCEL".equalsIgnoreCase(format)) {
            byte[] excelBytes = exportService.generateExcel(List.of());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", filenamePrefix + ".xlsx");
            return ResponseEntity.ok().headers(headers).body(excelBytes);
        } else {
            String csvText;
            if (isMulti) {
                csvText = "Account,Followers,Reach,Impressions,Engagements,Engagement Rate,Posts,Reels\n" +
                    "@brand_official,125430,482100,620000,38420,7.96%,342,128\n" +
                    "@brand_india,82000,310000,410000,21000,6.77%,190,85\n" +
                    "@brand_fashion,54000,198000,260000,15000,7.57%,115,42\n" +
                    "TOTAL / AVERAGE,261430,990100,1290000,74420,7.43%,647,255\n";
            } else {
                csvText = "Report Title,Generated Date,Followers,Engagement Rate,Top Post,Best Reel Views\n" +
                    reportType + " Report," + new Date() + ",125430,7.96%,ig_1001,48500\n";
            }

            byte[] csvBytes = csvText.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", filenamePrefix + ".csv");
            return ResponseEntity.ok().headers(headers).body(csvBytes);
        }
    }
}
