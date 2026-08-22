package com.socialmedia.instagram.repository;

import com.socialmedia.instagram.entity.Competitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompetitorRepository extends JpaRepository<Competitor, UUID> {
    List<Competitor> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Competitor> findByUserIdAndUsername(UUID userId, String username);
}
