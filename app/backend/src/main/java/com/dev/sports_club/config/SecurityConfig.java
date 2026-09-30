package com.dev.sports_club.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import com.dev.sports_club.security.CsrfCookieFilter;
import com.dev.sports_club.security.SpaCsrfTokenRequestHandler;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
public class SecurityConfig {

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /** A Super Admin can do everything an Admin can. */
    @Bean
    public RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.fromHierarchy("ROLE_SuperAdmin > ROLE_Admin");
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, ActiveUserFilter activeUserFilter) throws Exception {
        http
                .addFilterAfter(activeUserFilter, SecurityContextHolderFilter.class)
                // Cookie-based sessions need CSRF protection. The token lives in a readable XSRF-TOKEN cookie
                // and the app sends it back in the X-XSRF-TOKEN header on every write.
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
                .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .referrerPolicy(ref -> ref.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .permissionsPolicyHeader(pp -> pp.policy("geolocation=(), microphone=(), camera=(), payment=()"))
                        .frameOptions(frame -> frame.deny()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/capabilities").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()

                        // platform level: only a Super Admin manages organizations
                        .requestMatchers("/api/organizations/**").hasRole("SuperAdmin")
                        .requestMatchers(HttpMethod.GET, "/api/organization").authenticated()
                        .requestMatchers("/api/organization").hasRole("Admin")

                        // membership_type: front_desk SELECT only, admin full (per Ronald's grants)
                        .requestMatchers(HttpMethod.GET, "/api/membership-types/**").hasAnyRole("Admin", "FrontDesk", "Athlete")
                        .requestMatchers("/api/membership-types/**").hasRole("Admin")

                        // sport: coach SELECT only, admin full
                        .requestMatchers(HttpMethod.GET, "/api/sports/**").hasAnyRole("Admin", "Coach", "Athlete")
                        .requestMatchers("/api/sports/**").hasRole("Admin")

                        // athlete: front_desk SELECT/INSERT/UPDATE, coach SELECT, admin full
                        .requestMatchers(HttpMethod.GET, "/api/athletes/**").hasAnyRole("Admin", "FrontDesk", "Coach", "Athlete")
                        .requestMatchers(HttpMethod.POST, "/api/athletes/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers(HttpMethod.PUT, "/api/athletes/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers("/api/athletes/**").hasRole("Admin")

                        // coach: coach-role SELECT only, admin full
                        .requestMatchers(HttpMethod.GET, "/api/coaches/**").hasAnyRole("Admin", "Coach", "Athlete")
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
                        .requestMatchers(HttpMethod.GET, "/api/memberships/**").hasAnyRole("Admin", "FrontDesk", "Athlete")
                        .requestMatchers(HttpMethod.POST, "/api/memberships/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers(HttpMethod.PUT, "/api/memberships/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers("/api/memberships/**").hasRole("Admin")

                        // team: coach SELECT only, admin full
                        .requestMatchers(HttpMethod.GET, "/api/teams/**").hasAnyRole("Admin", "Coach", "Athlete")
                        .requestMatchers("/api/teams/**").hasRole("Admin")

                        // payment: front_desk SELECT/INSERT only (no UPDATE — Completed
                        // payments must not be alterable), admin full, coach none
                        .requestMatchers(HttpMethod.GET, "/api/payments/**").hasAnyRole("Admin", "FrontDesk", "Athlete")
                        .requestMatchers(HttpMethod.POST, "/api/payments/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers("/api/payments/**").hasRole("Admin")

                        // team_roster: coach SELECT only, admin full
                        .requestMatchers(HttpMethod.GET, "/api/team-rosters/**").hasAnyRole("Admin", "Coach", "Athlete")
                        .requestMatchers("/api/team-rosters/**").hasRole("Admin")

                        // fixtures: everyone signed in can read; Coaches may record results for their own teams
                        .requestMatchers(HttpMethod.GET, "/api/fixtures/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/fixtures/*/result").hasAnyRole("Admin", "Coach")
                        .requestMatchers("/api/fixtures/**").hasRole("Admin")

                        // attendance and training sessions: Admin and Coach manage; Athletes read their own
                        .requestMatchers("/api/training-sessions/**").hasAnyRole("Admin", "Coach")
                        .requestMatchers(HttpMethod.GET, "/api/attendance/**").hasAnyRole("Admin", "Coach", "Athlete")

                        // performance records
                        .requestMatchers(HttpMethod.GET, "/api/performance/**").hasAnyRole("Admin", "Coach", "Athlete")
                        .requestMatchers("/api/performance/**").hasAnyRole("Admin", "Coach")

                        // intelligence: organization-wide signals are staff-only; an athlete insight is scoped to what the caller may see
                        .requestMatchers(HttpMethod.GET, "/api/intelligence/athletes/**").hasAnyRole("Admin", "Coach", "Athlete")
                        .requestMatchers("/api/intelligence/retention/**").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers(HttpMethod.GET, "/api/intelligence/retention").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers(HttpMethod.GET, "/api/intelligence/anomalies").hasAnyRole("Admin", "FrontDesk")
                        .requestMatchers("/api/intelligence/**").hasRole("Admin")

                        // analytics overview is organization-wide, so Admin only; reports check the role per report type
                        .requestMatchers("/api/analytics/**").hasRole("Admin")
                        .requestMatchers(HttpMethod.GET, "/api/reports/**").hasAnyRole("Admin", "FrontDesk", "Coach")

                        // events, notifications, audit log, jobs
                        .requestMatchers(HttpMethod.GET, "/api/events/**").authenticated()
                        .requestMatchers("/api/events/**").hasRole("Admin")
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/api/audit-logs/**").hasRole("Admin")
                        .requestMatchers("/api/admin/jobs/**").hasRole("Admin")

                        // user management: admin only, always
                        .requestMatchers("/api/users/**").hasRole("Admin")

                        .anyRequest().authenticated()
                )
                // Unauthenticated (or expired-session) requests get a clean 401 the frontend can react to,
                // instead of Spring's default 403.
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write(
                            "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Please sign in to continue\"}");
                }));
        return http.build();
    }
}
