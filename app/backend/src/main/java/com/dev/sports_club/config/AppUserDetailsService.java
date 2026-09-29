package com.dev.sports_club.config;

import com.dev.sports_club.entity.AppUser;
import com.dev.sports_club.entity.OrganizationStatus;
import com.dev.sports_club.repository.AppUserRepository;
import com.dev.sports_club.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository repository;
    private final OrganizationRepository organizationRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser user = repository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Unknown username: " + username));

        return User.builder()
                .username(user.getUsername())
                .password(user.getPasswordHash())
                .authorities(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                .disabled(!Boolean.TRUE.equals(user.getIsActive()))
                .accountLocked(organizationSuspended(user))
                .build();
    }

    private boolean organizationSuspended(AppUser user) {
        if (user.getOrganizationId() == null) {
            return false;
        }
        return organizationRepository.findById(user.getOrganizationId())
                .map(o -> o.getStatus() == OrganizationStatus.Suspended)
                .orElse(true);
    }
}
