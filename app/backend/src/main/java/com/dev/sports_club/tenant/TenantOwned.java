package com.dev.sports_club.tenant;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

/**
 * Base class for every table that belongs to one organization. The "tenant" filter is enabled for
 * each request (see TenantFilterInterceptor), so queries only ever see the caller's organization.
 * Entities extending this class also carry {@code @Filter(name = "tenant")}.
 */
@MappedSuperclass
@EntityListeners(TenantEntityListener.class)
@FilterDef(name = "tenant", defaultCondition = "organization_id = :orgId",
        parameters = @ParamDef(name = "orgId", type = Integer.class))
@Getter
@Setter
public abstract class TenantOwned {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Integer organizationId;
}
