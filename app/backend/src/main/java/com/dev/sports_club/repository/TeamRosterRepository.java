package com.dev.sports_club.repository;

import com.dev.sports_club.entity.TeamRoster;
import com.dev.sports_club.entity.TeamRosterId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamRosterRepository extends JpaRepository<TeamRoster, TeamRosterId> {
}
