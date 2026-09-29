package com.dev.sports_club.tenant;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableJpaRepositories(basePackages = "com.dev.sports_club.repository", repositoryBaseClass = TenantJpaRepository.class)
@RequiredArgsConstructor
public class TenantConfig implements WebMvcConfigurer {

    private final TenantFilterInterceptor tenantFilterInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Must run after the open-EntityManager-in-view interceptor so it enables the filter on the
        // same EntityManager the request's queries use.
        registry.addInterceptor(tenantFilterInterceptor).order(Ordered.LOWEST_PRECEDENCE);
    }
}
