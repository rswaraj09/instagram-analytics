package com.socialmedia.instagram.service;

import com.socialmedia.instagram.dto.SpreadsheetRowDTO;
import com.socialmedia.instagram.entity.SpreadsheetRow;
import com.socialmedia.instagram.entity.User;
import com.socialmedia.instagram.repository.SpreadsheetRowRepository;
import com.socialmedia.instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

/**
 * Manages persistence of spreadsheet dashboard rows per user.
 * Rows are bulk-replaced on save (the frontend sends the full grid state).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SpreadsheetRowService {

    private final SpreadsheetRowRepository rowRepository;
    private final UserRepository userRepository;

    /**
     * Load all spreadsheet rows for a user, ordered by row_order.
     */
    @Transactional(readOnly = true)
    public List<SpreadsheetRowDTO> getRowsForUser(UUID userId) {
        return rowRepository.findByUserIdOrderByRowOrderAsc(userId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Replace all spreadsheet rows for a user with the provided list.
     * This is a full sync — old rows are deleted and new rows are inserted.
     */
    @Transactional
    public List<SpreadsheetRowDTO> saveRows(UUID userId, List<SpreadsheetRowDTO> rows) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        rowRepository.deleteAllByUserId(userId);
        rowRepository.flush();

        if (rows == null || rows.isEmpty()) {
            return List.of();
        }

        List<SpreadsheetRow> entities = IntStream.range(0, rows.size())
                .mapToObj(i -> toEntity(rows.get(i), user, i))
                .toList();

        List<SpreadsheetRow> saved = rowRepository.saveAll(entities);
        log.info("Saved {} spreadsheet rows for user {}", saved.size(), userId);
        return saved.stream().map(this::toDTO).toList();
    }

    /**
     * Delete a single row (by id) belonging to the user.
     */
    @Transactional
    public boolean deleteRow(UUID rowId, UUID userId) {
        int deleted = rowRepository.deleteByIdAndUserId(rowId, userId);
        if (deleted > 0) {
            log.info("Deleted spreadsheet row {} for user {}", rowId, userId);
        }
        return deleted > 0;
    }

    /**
     * Delete all spreadsheet rows for a user.
     */
    @Transactional
    public void deleteAllRows(UUID userId) {
        rowRepository.deleteAllByUserId(userId);
        log.info("Deleted all spreadsheet rows for user {}", userId);
    }

    private SpreadsheetRowDTO toDTO(SpreadsheetRow entity) {
        return SpreadsheetRowDTO.builder()
                .id(entity.getId().toString())
                .rowOrder(entity.getRowOrder())
                .profileUrl(entity.getProfileUrl())
                .username(entity.getUsername())
                .postUrl(entity.getPostUrl())
                .followersCount(entity.getFollowersCount())
                .followingCount(entity.getFollowingCount())
                .totalPosts(entity.getTotalPosts())
                .likesCount(entity.getLikesCount())
                .commentsCount(entity.getCommentsCount())
                .viewsCount(entity.getViewsCount())
                .reach(entity.getReach())
                .build();
    }

    private SpreadsheetRow toEntity(SpreadsheetRowDTO dto, User user, int order) {
        UUID id;
        try {
            id = UUID.fromString(dto.getId());
        } catch (Exception e) {
            id = UUID.randomUUID();
        }
        return SpreadsheetRow.builder()
                .id(id)
                .user(user)
                .rowOrder(order)
                .profileUrl(dto.getProfileUrl())
                .username(dto.getUsername())
                .postUrl(dto.getPostUrl())
                .followersCount(dto.getFollowersCount())
                .followingCount(dto.getFollowingCount())
                .totalPosts(dto.getTotalPosts())
                .likesCount(dto.getLikesCount())
                .commentsCount(dto.getCommentsCount())
                .viewsCount(dto.getViewsCount())
                .reach(dto.getReach())
                .build();
    }
}
