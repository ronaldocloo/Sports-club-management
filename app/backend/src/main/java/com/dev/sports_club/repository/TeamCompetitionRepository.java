package com.dev.sports_club.repository;

import com.dev.sports_club.entity.TeamCompetition;
import com.dev.sports_club.entity.TeamCompetitionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamCompetitionRepository extends JpaRepository<TeamCompetition, TeamCompetitionId> {
}
