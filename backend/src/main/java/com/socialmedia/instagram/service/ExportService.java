package com.socialmedia.instagram.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.socialmedia.instagram.dto.SpreadsheetRowDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Generates Excel (.xlsx) and PDF exports of the spreadsheet dashboard data.
 * Implements the backend half of Issue #7.
 */
@Service
@Slf4j
public class ExportService {

    private static final String[] HEADERS = {
        "Profile URL", "Username", "Followers", "Following", "No. of Posts",
        "Post URL", "Likes", "Comments", "Views", "Reach"
    };

    /**
     * Generate an .xlsx workbook of the given rows.
     */
    public byte[] generateExcel(List<SpreadsheetRowDTO> rows) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Instagram Analytics");

            // Header style: bold white text on a blue background
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Numeric style with comma separators
            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (SpreadsheetRowDTO row : rows) {
                Row dataRow = sheet.createRow(rowIdx++);
                setStringCell(dataRow, 0, row.getProfileUrl());
                setStringCell(dataRow, 1, row.getUsername());
                setNumberCell(dataRow, 2, row.getFollowersCount(), numberStyle);
                setNumberCell(dataRow, 3, row.getFollowingCount(), numberStyle);
                setNumberCell(dataRow, 4, row.getTotalPosts() != null ? row.getTotalPosts().longValue() : null, numberStyle);
                setStringCell(dataRow, 5, row.getPostUrl());
                setNumberCell(dataRow, 6, row.getLikesCount(), numberStyle);
                setNumberCell(dataRow, 7, row.getCommentsCount(), numberStyle);
                setNumberCell(dataRow, 8, row.getViewsCount(), numberStyle);
                setNumberCell(dataRow, 9, row.getReach(), numberStyle);
            }

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (IOException e) {
            log.error("Failed to generate Excel export: {}", e.getMessage(), e);
            throw new UncheckedIOException("Failed to generate Excel export", e);
        }
    }

    /**
     * Generate a landscape PDF report of the given rows.
     */
    public byte[] generatePdf(List<SpreadsheetRowDTO> rows) {
        Document document = new Document(PageSize.A4.rotate(), 24, 24, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Paragraph title = new Paragraph("Instagram Analytics Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            String generatedAt = ZonedDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z"));
            Paragraph subtitle = new Paragraph("Generated: " + generatedAt, subFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(16f);
            document.add(subtitle);

            PdfPTable table = new PdfPTable(HEADERS.length);
            table.setWidthPercentage(100);

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            for (String header : HEADERS) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(new Color(63, 81, 181)); // indigo
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5f);
                table.addCell(cell);
            }

            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);
            for (SpreadsheetRowDTO row : rows) {
                addPdfCell(table, row.getProfileUrl(), cellFont, false);
                addPdfCell(table, row.getUsername(), cellFont, false);
                addPdfCell(table, formatNumber(row.getFollowersCount()), cellFont, true);
                addPdfCell(table, formatNumber(row.getFollowingCount()), cellFont, true);
                addPdfCell(table, formatNumber(row.getTotalPosts() != null ? row.getTotalPosts().longValue() : null), cellFont, true);
                addPdfCell(table, row.getPostUrl(), cellFont, false);
                addPdfCell(table, formatNumber(row.getLikesCount()), cellFont, true);
                addPdfCell(table, formatNumber(row.getCommentsCount()), cellFont, true);
                addPdfCell(table, formatNumber(row.getViewsCount()), cellFont, true);
                addPdfCell(table, formatNumber(row.getReach()), cellFont, true);
            }

            document.add(table);
            document.close();
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate PDF export: {}", e.getMessage(), e);
            if (document.isOpen()) {
                document.close();
            }
            throw new RuntimeException("Failed to generate PDF export", e);
        }
    }

    private void setStringCell(Row row, int col, String value) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
    }

    private void setNumberCell(Row row, int col, Long value, CellStyle numberStyle) {
        Cell cell = row.createCell(col);
        if (value != null) {
            cell.setCellValue(value);
            cell.setCellStyle(numberStyle);
        } else {
            cell.setCellValue("");
        }
    }

    private void addPdfCell(PdfPTable table, String text, Font font, boolean rightAlign) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setHorizontalAlignment(rightAlign ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
        cell.setPadding(4f);
        table.addCell(cell);
    }

    private String formatNumber(Long value) {
        return value != null ? String.format("%,d", value) : "";
    }
}
