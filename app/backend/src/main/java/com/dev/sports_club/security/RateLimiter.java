package com.dev.sports_club.security;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** In-memory sliding-window limiter: at most {@code limit} hits per key in any {@code windowMillis}. */
public class RateLimiter {

    private final int limit;
    private final long windowMillis;
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public RateLimiter(int limit, long windowMillis) {
        this.limit = limit;
        this.windowMillis = windowMillis;
    }

    /** Records a hit and returns 0 if allowed, or the milliseconds to wait if the limit is exceeded. */
    public long tryAcquire(String key, long nowMillis) {
        Deque<Long> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && nowMillis - q.peekFirst() >= windowMillis) q.pollFirst();
            if (q.size() >= limit) return windowMillis - (nowMillis - q.peekFirst());
            q.addLast(nowMillis);
            return 0;
        }
    }

    /** Drops idle keys so the map cannot grow without bound. */
    public void prune(long nowMillis) {
        hits.entrySet().removeIf(e -> {
            synchronized (e.getValue()) {
                while (!e.getValue().isEmpty() && nowMillis - e.getValue().peekFirst() >= windowMillis) e.getValue().pollFirst();
                return e.getValue().isEmpty();
            }
        });
    }
}
