package com.dev.sports_club.service;

import com.dev.sports_club.entity.AppUser;
import com.dev.sports_club.entity.AppUserRole;
import com.dev.sports_club.entity.Membership;
import com.dev.sports_club.entity.Team;
import com.dev.sports_club.entity.TeamRoster;
import com.dev.sports_club.repository.AppUserRepository;
import com.dev.sports_club.repository.MembershipRepository;
import com.dev.sports_club.repository.TeamRepository;
import com.dev.sports_club.repository.TeamRosterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Decides which records the signed-in user may see.
 *
 * Admin and FrontDesk see everything their endpoint rules allow. A Coach sees only the teams
 * they coach and the athletes on those teams. An Athlete sees only their own record, their own
 * memberships and payments, and the teams they play for.
 */
@Component
@RequiredArgsConstructor
public class AccessScope {

    private final AppUserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamRosterRepository rosterRepository;
    private final MembershipRepository membershipRepository;

    public Visible current() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Not authenticated");
        }
        AppUser user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("Unknown user"));

        if (user.getRole() == AppUserRole.Admin || user.getRole() == AppUserRole.FrontDesk) {
            return Visible.everything();
        }

        Set<Integer> teams = new HashSet<>();
        Set<Integer> athletes = new HashSet<>();
        Set<Integer> memberships = new HashSet<>();

        if (user.getRole() == AppUserRole.Coach && user.getCoachId() != null) {
            List<Team> mine = teamRepository.findByCoachId(user.getCoachId());
            mine.forEach(t -> teams.add(t.getTeamId()));
            if (!teams.isEmpty()) {
                rosterRepository.findByIdTeamIdIn(teams).forEach(r -> athletes.add(r.getId().getAthleteId()));
            }
        } else if (user.getRole() == AppUserRole.Athlete && user.getAthleteId() != null) {
            athletes.add(user.getAthleteId());
            rosterRepository.findByIdAthleteId(user.getAthleteId()).stream()
                    .map(TeamRoster::getId).forEach(id -> teams.add(id.getTeamId()));
            membershipRepository.findByAthleteId(user.getAthleteId()).stream()
                    .map(Membership::getMembershipId).forEach(memberships::add);
        }
        return new Visible(false, teams, athletes, memberships);
    }

    public record Visible(boolean unrestricted, Set<Integer> teamIds, Set<Integer> athleteIds, Set<Integer> membershipIds) {

        static Visible everything() {
            return new Visible(true, Collections.emptySet(), Collections.emptySet(), Collections.emptySet());
        }

        public boolean athlete(Integer id) { return unrestricted || athleteIds.contains(id); }
        public boolean team(Integer id) { return unrestricted || teamIds.contains(id); }
        public boolean membership(Integer id) { return unrestricted || membershipIds.contains(id); }

        public void requireAthlete(Integer id) { if (!athlete(id)) throw new AccessDeniedException("Not allowed to view this athlete"); }
        public void requireTeam(Integer id) { if (!team(id)) throw new AccessDeniedException("Not allowed to view this team"); }
        public void requireMembership(Integer id) { if (!membership(id)) throw new AccessDeniedException("Not allowed to view this membership"); }
    }
}
