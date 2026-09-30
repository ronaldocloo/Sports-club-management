package com.dev.sports_club.tenant;

import jakarta.persistence.EntityManager;
import org.springframework.data.jpa.repository.support.JpaEntityInformation;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;

import java.util.Objects;
import java.util.Optional;

/**
 * Hibernate filters do not apply to lookups by primary key, so this base class hides rows that
 * belong to another organization. It also protects deleteById, which is built on findById.
 */
public class TenantJpaRepository<T, ID> extends SimpleJpaRepository<T, ID> {

    public TenantJpaRepository(JpaEntityInformation<T, ?> entityInformation, EntityManager entityManager) {
        super(entityInformation, entityManager);
    }

    @Override
    public Optional<T> findById(ID id) {
        return super.findById(id).filter(TenantJpaRepository::visible);
    }

    private static boolean visible(Object entity) {
        if (!(entity instanceof TenantOwned owned)) {
            return true;
        }
        Integer context = TenantContext.get();
        return context == null || Objects.equals(context, owned.getOrganizationId());
    }
}
