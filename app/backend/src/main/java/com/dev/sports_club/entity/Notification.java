package com.dev.sports_club.entity;

import com.dev.sports_club.tenant.TenantOwned;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** One row per recipient. Not tenant-filtered: it is scoped to the signed-in user instead. */
@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Integer notificationId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "organization_id")
    private Integer organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false)
    private NotificationKind kind;

    @Column(name = "message", nullable = false, length = 255)
    private String message;

    @Column(name = "link", length = 150)
    private String link;

    @Column(name = "dedupe_key", length = 100)
    private String dedupeKey;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
