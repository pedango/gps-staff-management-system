// src/config/performance.ts
// ============================================================================
// AUTORESEARCH PERFORMANCE TUNING CONFIG
// ============================================================================
// The agent ONLY modifies this file. Everything else is read-only.
// Commit changes here to experiment with optimizations.
// ============================================================================

export const PerformanceConfig = {
  // ========== DATABASE & PRISMA QUERY OPTIMIZATION ==========
  prisma: {
    // Batch size for db queries (e.g., fetching members)
    // Lower: slower but less memory; Higher: faster but more memory
    batchSize: 50, // ← AGENT TUNES THIS

    // Query timeout in milliseconds
    queryTimeout: 5000, // ← AGENT TUNES THIS

    // Enable statement caching (improves repeated query performance)
    enableStatementCaching: true, // ← AGENT TOGGLES THIS

    // Connection pool size
    poolSize: 20, // ← AGENT TUNES THIS
  },

  // ========== RESPONSE CACHING (Upstash Redis) ==========
  cache: {
    // Time-to-live for Redis cache (seconds)
    // Members list, admin data, etc.
    defaultTTL: 600, // ← AGENT TUNES THIS (5 min default)

    // API response cache TTL (shorter for frequently changing data)
    apiResponseTTL: 180, // ← AGENT TUNES THIS (1 min default)

    // Message cache TTL
    messageCacheTTL: 120, // ← AGENT TUNES THIS

    // Enable gzip compression for cached values
    enableCompression: true, // ← AGENT TOGGLES THIS
  },

  // ========== UPSTASH REDIS CONNECTION TUNING ==========
  redis: {
    // Max concurrent Redis connections
    maxConnections: 10, // ← AGENT TUNES THIS

    // Batch Redis operations (pipelining) for better throughput
    enablePipelining: true, // ← AGENT TOGGLES THIS

    // Retry failed Redis operations
    maxRetries: 3, // ← AGENT TUNES THIS
  },

  // ========== API RESPONSE OPTIMIZATION ==========
  api: {
    // Batch multiple queries into one (for /api/members, etc.)
    enableRequestCoalescing: true, // ← AGENT TOGGLES THIS

    // Time window for coalescing (ms)
    // If 2 requests come within 10ms, batch them
    coalesceWindowMs: 10, // ← AGENT TUNES THIS

    // Enable response streaming for large payloads
    enableResponseStreaming: false, // ← AGENT TOGGLES THIS
  },

  // ========== NEXT.JS EDGE CACHING (Vercel ISR) ==========
  edge: {
    // Enable edge caching at Vercel CDN
    enableEdgeCache: true, // ← AGENT TOGGLES THIS

    // Stale-while-revalidate: serve old cache while revalidating in background
    staleWhileRevalidate: 30, // ← AGENT TUNES THIS (seconds)

    // Max age for edge cache
    maxAge: 60, // ← AGENT TUNES THIS (seconds)
  },

  // ========== IMAGE OPTIMIZATION ==========
  images: {
    // Enable aggressive image optimization
    enableOptimization: true, // ← AGENT TOGGLES THIS

    // Default image quality (1-100, lower = smaller size)
    quality: 85, // ← AGENT TUNES THIS
  },

  // ========== FRONTEND PERFORMANCE ==========
  frontend: {
    // React Query stale time (how long before data is considered stale)
    queryStaleTime: 60000, // ← AGENT TUNES THIS (ms, 1 min default)

    // React Query cache time (how long to keep in memory)
    queryCacheTime: 300000, // ← AGENT TUNES THIS (ms, 5 min default)

    // Enable concurrent rendering
    enableConcurrentRendering: true, // ← AGENT TOGGLES THIS
  },

  // ========== DATABASE INDEXES ==========
  // If true, ensure indexes are present on frequently queried columns
  indexes: {
    // These should already exist, but agent can monitor them
    ensureOptimalIndexes: true, // ← AGENT TOGGLES THIS
  },
};

export type PerformanceConfigType = typeof PerformanceConfig;
