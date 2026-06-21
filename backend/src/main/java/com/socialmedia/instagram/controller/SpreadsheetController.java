package com.socialmedia.instagram.controller;

import com.socialmedia.instagram.dto.SpreadsheetRowDTO;
import com.socialmedia.instagram.service.SpreadsheetRowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for persisting the spreadsheet dashboard rows per user.
 * All endpoints derive the user from the JWT principal (UUID).
 */
@RestController
@RequestMapping("/api/spreadsheet/rows")
@RequiredArgsConstructor
@Slf4j
public class SpreadsheetController {

    private final SpreadsheetRowService spreadsheetRowService;

    /**
     * Load all saved spreadsheet rows for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<SpreadsheetRowDTO>> getRows(
            @org.springframework.security.core.annotation.AuthenticationPrincipal UUID userId) {
        List<SpreadsheetRowDTO> rows = spreadsheetRowService.getRowsForUser(userId);
        return ResponseEntity.ok(rows);
    }

    /**
     * Save (full replace) the spreadsheet rows for the authenticated user.
     */
    @PutMapping
    public ResponseEntity<List<SpreadsheetRowDTO>> saveRows(
            @org.springframework.security.core.annotation.AuthenticationPrincipal UUID userId,
            @RequestBody List<SpreadsheetRowDTO> rows) {
        List<SpreadsheetRowDTO> saved = spreadsheetRowService.saveRows(userId, rows);
        return ResponseEntity.ok(saved);
    }

    /**
     * Delete a single spreadsheet row by id.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRow(
            @org.springframework.security.core.annotation.AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        boolean deleted = spreadsheetRowService.deleteRow(id, userId);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete ALL spreadsheet rows for the authenticated user.
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteAllRows(
            @org.springframework.security.core.annotation.AuthenticationPrincipal UUID userId) {
        spreadsheetRowService.deleteAllRows(userId);
        return ResponseEntity.noContent().build();
    }
}
