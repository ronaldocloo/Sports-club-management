package com.dev.sports_club.service;

import com.dev.sports_club.dto.*;
import com.dev.sports_club.entity.*;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.*;
import com.dev.sports_club.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Business rules that run on a schedule: expire memberships past their end date and warn about
 * memberships and competitions coming up. The scheduler runs it across every organization; when an
 * Admin triggers it from the API the tenant filter limits it to their own organization.
 */
@Service
@RequiredArgsConstructor
public class DailyJobService {

    private final MembershipRepository membershipRepository;
    private final AthleteRepository athleteRepository;
    private final CompetitionRepository competitionRepository;
    private final AppUserRepository userRepository;
    private final NotificationService notifications;

    public record Result(int expired, int expiringSoon, int upcomingCompetitions) { }

    @Transactional
    public Result run() {
        LocalDate today = LocalDate.now();
        int expired = 0;
        int soon = 0;
        for (Membership m : membershipRepository.findAll()) {
            if (m.getStatus() != MembershipStatus.Active) continue;
            if (m.getEndDate().isBefore(today)) {
                m.setStatus(MembershipStatus.Expired);
                membershipRepository.save(m);
                expired++;
                continue;
            }
            if (!m.getEndDate().isAfter(today.plusDays(7))) {
                String name = athleteRepository.findById(m.getAthleteId()).map(a -> a.getFirstName() + " " + a.getLastName()).orElse("An athlete");
                long days = java.time.temporal.ChronoUnit.DAYS.between(today, m.getEndDate());
                String when = days == 0 ? "today" : "in " + days + (days == 1 ? " day" : " days");
                String key = "membership-expiring:" + m.getMembershipId() + ":" + m.getEndDate();
                notifications.notifyRoles(m.getOrganizationId(), List.of(AppUserRole.Admin, AppUserRole.FrontDesk), NotificationKind.membership,
                        "Membership expires " + when + " for " + name + ".", "/memberships", key);
                notifications.notifyUsers(userRepository.findByAthleteIdAndIsActiveTrue(m.getAthleteId()), NotificationKind.membership,
                        "Your membership expires " + when + ".", "/me", key);
                soon++;
            }
        }
        int comps = 0;
        for (Competition c : competitionRepository.findAll()) {
            if (!c.getCompDate().isBefore(today) && !c.getCompDate().isAfter(today.plusDays(3))) {
                notifications.notifyRoles(c.getOrganizationId(), List.of(AppUserRole.Admin, AppUserRole.Coach), NotificationKind.competition,
                        c.getCompName() + " is on " + c.getCompDate() + ".", "/competitions/" + c.getCompetitionId(), "competition-soon:" + c.getCompetitionId());
                comps++;
            }
        }
        return new Result(expired, soon, comps);
    }
}
