package com.dev.sports_club.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
public class SecurityConfig {

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // REST API consumed by a separate React frontend, not a server-rendered
                // HTML form — CSRF protection is designed for the latter, so it's disabled here.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login").permitAll()

                        // membership_type: front_desk SELECT only, admin full (per Ronald's grants)
                        .requestMatchers(HttpMethod.GET, "/api/membership-types/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers("/api/membership-types/**").hasRole("Admin")

                        // sport: coach SELECT only, admin full
                        .requestMatchers(HttpMethod.GET, "/api/sports/**").hasAnyRole("Admin", "Coach")
                        .requestMatchers("/api/sports/**").hasRole("Admin")

                        // athlete: front_desk SELECT/INSERT/UPDATE, coach SELECT, admin full
                        .requestMatchers(HttpMethod.GET, "/api/athletes/**").hasAnyRole("Admin", "FrontDesk", "Coach")
                        .requestMatchers(HttpMethod.POST, "/api/athletes/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers(HttpMethod.PUT, "/api/athletes/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers("/api/athletes/**").hasRole("Admin")

                        // coach: coach-role SELECT only, admin full
                        .requestMatchers(HttpMethod.GET, "/api/coaches/**").hasAnyRole("Admin", "Coach")
                        .requestMatchers("/api/coaches/**").hasRole("Admin")

                        // facility, competition, facility_booking, team_competition: not addressed
                        // in Ronald's grants file for front_desk/coach — open read to any
                        // logged-in role, writes stay admin-only (agreed extension).
                        .requestMatchers(HttpMethod.GET, "/api/facilities/**").authenticated()
                        .requestMatchers("/api/facilities/**").hasRole("Admin")

                        .requestMatchers(HttpMethod.GET, "/api/competitions/**").authenticated()
                        .requestMatchers("/api/competitions/**").hasRole("Admin")

                        .requestMatchers(HttpMethod.GET, "/api/facility-bookings/**").authenticated()
                        .requestMatchers("/api/facility-bookings/**").hasRole("Admin")

                        .requestMatchers(HttpMethod.GET, "/api/team-competitions/**").authenticated()
                        .requestMatchers("/api/team-competitions/**").hasRole("Admin")

                        // membership: front_desk SELECT/INSERT/UPDATE, admin full, coach none
                        .requestMatchers(HttpMethod.GET, "/api/memberships/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers(HttpMethod.POST, "/api/memberships/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers(HttpMethod.PUT, "/api/memberships/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers("/api/memberships/**").hasRole("Admin")

                        // team: coach SELECT only, admin full
                        .requestMatchers(HttpMethod.GET, "/api/teams/**").hasAnyRole("Admin", "Coach")
                        .requestMatchers("/api/teams/**").hasRole("Admin")

                        // payment: front_desk SELECT/INSERT only (no UPDATE — Completed
                        // payments must not be alterable), admin full, coach none
                        .requestMatchers(HttpMethod.GET, "/api/payments/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers(HttpMethod.POST, "/api/payments/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers("/api/payments/**").hasRole("Admin")

                        // team_roster: coach SELECT only, admin full
                        .requestMatchers(HttpMethod.GET, "/api/team-rosters/**").hasAnyRole("Admin", "Coach")
                        .requestMatchers("/api/team-rosters/**").hasRole("Admin")

                        // user management: admin only, always
                        .requestMatchers("/api/users/**").hasRole("Admin")

                        .anyRequest().authenticated()
                );
        return http.build();
    }
}
