package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.dto.SpreadsheetRowDTO;
import com.socialmedia.instagram.service.ExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for exporting the spreadsheet dashboard data as Excel or PDF.
 * Implements Issue #7. Export requires ADMIN, MANAGER, or ANALYST role.
 */
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@Slf4j
public class ExportController {

    private final ExportService exportService;

    @PostMapping("/excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ANALYST', 'VIEWER')")
    public ResponseEntity<byte[]> exportExcel(@RequestBody List<SpreadsheetRowDTO> rows) {
        List<SpreadsheetRowDTO> nonEmpty = withoutEmptyRows(rows);
        log.info("Exporting {} rows to Excel", nonEmpty.size());
        byte[] excelBytes = exportService.generateExcel(nonEmpty);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=instagram-analytics.xlsx")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(excelBytes);
    }

    @PostMapping("/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ANALYST', 'VIEWER')")
    public ResponseEntity<byte[]> exportPdf(@RequestBody List<SpreadsheetRowDTO> rows) {
        List<SpreadsheetRowDTO> nonEmpty = withoutEmptyRows(rows);
        log.info("Exporting {} rows to PDF", nonEmpty.size());
        byte[] pdfBytes = exportService.generatePdf(nonEmpty);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=instagram-analytics.pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdfBytes);
    }

    /**
     * Drop rows that have no meaningful data so empty grid rows are not exported.
     */
    private List<SpreadsheetRowDTO> withoutEmptyRows(List<SpreadsheetRowDTO> rows) {
        if (rows == null) {
            return List.of();
        }
        return rows.stream().filter(this::hasData).toList();
    }

    private boolean hasData(SpreadsheetRowDTO row) {
        if (row == null) {
            return false;
        }
        return isNotBlank(row.getProfileUrl())
            || isNotBlank(row.getUsername())
            || isNotBlank(row.getPostUrl())
            || row.getFollowersCount() != null
            || row.getFollowingCount() != null
            || row.getTotalPosts() != null
            || row.getLikesCount() != null
            || row.getCommentsCount() != null
            || row.getViewsCount() != null
            || row.getReach() != null;
    }

    private boolean isNotBlank(String s) {
        return s != null && !s.isBlank();
    }
}
