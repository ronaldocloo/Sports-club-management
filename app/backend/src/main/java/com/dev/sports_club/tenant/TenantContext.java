package com.dev.sports_club.tenant;

/**
 * The organization the current request is working in. Set by ActiveUserFilter for every
 * authenticated request and cleared afterwards. Background jobs run with no context, which means
 * "all organizations" (they must always set organizationId on anything they create).
 */
public final class TenantContext {

    /** Used when a request has no usable organization; matches no row, so nothing leaks. */
    public static final int NONE = -1;

    private static final ThreadLocal<Integer> CURRENT = new ThreadLocal<>();

    private TenantContext() { }

    public static Integer get() { return CURRENT.get(); }

    public static void set(Integer organizationId) { CURRENT.set(organizationId); }

    public static void clear() { CURRENT.remove(); }

    public static boolean hasOrganization() {
        Integer id = CURRENT.get();
        return id != null && id > 0;
    }
}
