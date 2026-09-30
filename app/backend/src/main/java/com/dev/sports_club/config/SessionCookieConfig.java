package com.dev.sports_club.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * The sign-in cookie for database-backed sessions. Set explicitly, from the same properties as before
 * (server.servlet.session.cookie.*), so it is always HttpOnly and SameSite, and Secure whenever configured,
 * instead of depending on how the web server was started.
 */
@Configuration
public class SessionCookieConfig {

    @Bean
    public CookieSerializer cookieSerializer(
            @Value("${server.servlet.session.cookie.same-site:lax}") String sameSite,
            @Value("${server.servlet.session.cookie.secure:#{null}}") Boolean secure) {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("SESSION");
        serializer.setCookiePath("/");
        serializer.setUseHttpOnlyCookie(true);
        // Normalise to the conventional spelling: Lax, Strict, None.
        String value = sameSite == null || sameSite.isBlank() ? "Lax" : sameSite.substring(0, 1).toUpperCase() + sameSite.substring(1).toLowerCase();
        serializer.setSameSite(value);
        if (secure != null) serializer.setUseSecureCookie(secure);
        return serializer;
    }
}
