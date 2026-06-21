package com.socialmedia.instagram.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * IP-based rate limiting using Bucket4j (Issue 4). Runs before all other
 * filters so abusive clients are rejected with HTTP 429 + Retry-After.
 *   - POST /api/auth/login    -> 5 requests/min
 *   - POST /api/auth/register -> 3 requests/min
 *   - all other endpoints     -> 60 requests/min
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private final ConcurrentHashMap<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> registerBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> generalBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        String clientId = resolveClientIp(request);

        Bucket bucket;
        if ("POST".equalsIgnoreCase(method) && path.endsWith("/api/auth/login")) {
            bucket = loginBuckets.computeIfAbsent(clientId, k -> newBucket(5));
        } else if ("POST".equalsIgnoreCase(method) && path.endsWith("/api/auth/register")) {
            bucket = registerBuckets.computeIfAbsent(clientId, k -> newBucket(3));
        } else {
            bucket = generalBuckets.computeIfAbsent(clientId, k -> newBucket(60));
        }

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
        } else {
            long waitSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000L;
            response.setStatus(429);
            response.addHeader("Retry-After", String.valueOf(Math.max(1, waitSeconds)));
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
            log.warn("Rate limit exceeded for {} on {} {}", clientId, method, path);
        }
    }

    private Bucket newBucket(long perMinute) {
        Bandwidth limit = Bandwidth.simple(perMinute, Duration.ofMinutes(1));
        return Bucket.builder().addLimit(limit).build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
