package com.dev.sports_club.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScheduledJobs {

    private static final Logger log = LoggerFactory.getLogger(ScheduledJobs.class);

    private final DailyJobService jobs;

    /** Every day at 06:00 server time, across all organizations. */
    @Scheduled(cron = "0 0 6 * * *")
    public void daily() {
        DailyJobService.Result r = jobs.run();
        log.info("Daily job: {} memberships expired, {} expiring soon, {} upcoming competitions", r.expired(), r.expiringSoon(), r.upcomingCompetitions());
    }
}
