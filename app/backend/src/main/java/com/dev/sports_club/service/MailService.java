package com.dev.sports_club.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Sends plain-text email when SMTP is configured (spring.mail.host and app.mail.from), and does nothing otherwise, so
 * the platform runs fine without email and the interface can say so. Sending happens on a background thread so that a
 * slow mail server does not change how long a request takes (which would reveal whether an address has an account).
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> sender;
    private final String host;
    private final String from;
    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "mail-sender");
        t.setDaemon(true);
        return t;
    });

    public MailService(ObjectProvider<JavaMailSender> sender,
                       @Value("${spring.mail.host:}") String host,
                       @Value("${app.mail.from:}") String from) {
        this.sender = sender;
        this.host = host == null ? "" : host.trim();
        this.from = from == null ? "" : from.trim();
    }

    public boolean isEnabled() {
        return !host.isEmpty() && !from.isEmpty() && sender.getIfAvailable() != null;
    }

    public void send(String to, String subject, String text) {
        if (!isEnabled()) return;
        JavaMailSender mailSender = sender.getIfAvailable();
        executor.submit(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(from);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(text);
                mailSender.send(message);
            } catch (Exception e) {
                // Never log the address or the message body (the body contains a secret link).
                log.warn("Could not send an email: {}", e.getClass().getSimpleName());
            }
        });
    }
}
