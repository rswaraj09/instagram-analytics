package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.SpreadsheetRow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for spreadsheet row CRUD per user.
 */
@Repository
public interface SpreadsheetRowRepository extends JpaRepository<SpreadsheetRow, UUID> {

    List<SpreadsheetRow> findByUserIdOrderByRowOrderAsc(UUID userId);

    Optional<SpreadsheetRow> findByIdAndUserId(UUID id, UUID userId);

    @Modifying
    @Query("DELETE FROM SpreadsheetRow sr WHERE sr.user.id = :userId")
    void deleteAllByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM SpreadsheetRow sr WHERE sr.id = :id AND sr.user.id = :userId")
    int deleteByIdAndUserId(UUID id, UUID userId);
}
