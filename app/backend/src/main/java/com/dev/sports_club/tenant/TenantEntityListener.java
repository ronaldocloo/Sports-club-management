package com.dev.sports_club.tenant;

import jakarta.persistence.PrePersist;

/** Stamps new rows with the caller's organization so a row can never be saved without an owner. */
public class TenantEntityListener {

    @PrePersist
    public void assignOrganization(Object entity) {
        if (entity instanceof TenantOwned owned && owned.getOrganizationId() == null) {
            if (!TenantContext.hasOrganization()) {
                throw new IllegalStateException("No organization selected for this request");
            }
            owned.setOrganizationId(TenantContext.get());
        }
    }
}
