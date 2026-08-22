package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.ContentCalendarItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContentCalendarRepository extends JpaRepository<ContentCalendarItem, UUID> {
    List<ContentCalendarItem> findByUserIdOrderByScheduledDateAsc(UUID userId);
}
