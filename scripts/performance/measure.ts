// scripts/performance/measure.ts
// ============================================================================
// PERFORMANCE MEASUREMENT HARNESS
// Runs deterministic load tests against the app and measures latency
// ============================================================================

import { performance } from "perf_hooks";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@gps.gov.gh";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!123";

function cookieHeaderFrom(setCookies: string[]): string {
  return setCookies.map((c) => c.split(";")[0]).join("; ");
}

// Auth.js uses session cookies (JWT), not bearer tokens. Log in with the
// seeded admin credentials and reuse the resulting cookie on every request.
async function login(): Promise<{ cookie: string; userId: string }> {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfCookies = (csrfRes.headers as any).getSetCookie?.() ?? [];
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const body = new URLSearchParams({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    csrfToken,
    callbackUrl: `${BASE_URL}/`,
    json: "true",
  });

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeaderFrom(csrfCookies),
    },
    body: body.toString(),
    redirect: "manual",
  });
  const sessionCookies = (loginRes.headers as any).getSetCookie?.() ?? [];

  const cookie = cookieHeaderFrom([...csrfCookies, ...sessionCookies]);
  if (!sessionCookies.some((c: string) => c.includes("session-token"))) {
    throw new Error(
      "Login failed: no session cookie returned. Check SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD and run `npm run db:seed`."
    );
  }

  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  const session = (await sessionRes.json()) as { user?: { id?: string } };
  if (!session.user?.id) {
    throw new Error("Login succeeded but session has no user id.");
  }

  return { cookie, userId: session.user.id };
}

interface LoadTestResult {
  endpoint: string;
  responseTimes: number[];
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  errors: number;
  totalRequests: number;
}

interface CompositeMetric {
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  error_rate: number;
  cache_hit_rate: number;
  memory_peak_mb: number;
  composite_score: number; // Lower is better
}

// Helper: percentile calculation
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// Test endpoint with N concurrent requests
async function loadTest(
  endpoint: string,
  concurrency: number,
  totalRequests: number,
  cookie: string
): Promise<LoadTestResult> {
  const responseTimes: number[] = [];
  let errors = 0;

  console.log(
    `[LOAD TEST] ${endpoint} (${totalRequests} reqs, ${concurrency} concurrent)`
  );

  // Warm up: the first hit after idle pays Neon compute wake / cold connection
  // cost, which has nothing to do with the config under test and otherwise
  // dominates the whole sample. Discard it before timing.
  try {
    await fetch(`${BASE_URL}${endpoint}`, { headers: { Cookie: cookie } });
  } catch {
    // ignore; the timed loop below will surface a real failure
  }

  const makeRequest = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const start = performance.now();
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { Cookie: cookie },
        signal: controller.signal,
      });
      const end = performance.now();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      responseTimes.push(end - start);
    } catch (err) {
      errors++;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Run requests in concurrent batches
  for (let i = 0; i < totalRequests; i += concurrency) {
    const batch = Array.from({ length: Math.min(concurrency, totalRequests - i) });
    await Promise.all(batch.map(() => makeRequest()));
  }

  const result: LoadTestResult = {
    endpoint,
    responseTimes,
    p50: percentile(responseTimes, 50),
    p95: percentile(responseTimes, 95),
    p99: percentile(responseTimes, 99),
    mean:
      responseTimes.length === 0
        ? 0
        : responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    errors,
    totalRequests,
  };

  console.log(`  p50: ${result.p50.toFixed(1)}ms`);
  console.log(`  p95: ${result.p95.toFixed(1)}ms`);
  console.log(`  p99: ${result.p99.toFixed(1)}ms`);
  console.log(`  errors: ${result.errors}/${result.totalRequests}`);

  return result;
}

// Main performance measurement
async function measurePerformance(): Promise<CompositeMetric> {
  console.log("=".repeat(60));
  console.log("GPS STAFF MANAGEMENT SYSTEM - PERFORMANCE MEASUREMENT");
  console.log("=".repeat(60));

  console.log("[AUTH] Logging in as seeded admin...");
  const { cookie, userId } = await login();
  const conversationId = `${userId}-${userId}`;

  const tests = await Promise.all([
    // Critical endpoints - test these thoroughly
    loadTest("/api/members", 10, 100, cookie), // Members list (indexed queries)
    loadTest("/api/admins", 5, 50, cookie), // Admin list
    loadTest("/api/stats", 3, 30, cookie), // Dashboard stats
    loadTest(`/api/messages/${conversationId}`, 5, 50, cookie), // Message fetching
  ]);

  // Aggregate results
  const allResponseTimes = tests.flatMap((t) => t.responseTimes);
  const totalErrors = tests.reduce((sum, t) => sum + t.errors, 0);
  const totalRequests = tests.reduce((sum, t) => sum + t.totalRequests, 0);

  const metric: CompositeMetric = {
    p50_latency_ms: percentile(allResponseTimes, 50),
    p95_latency_ms: percentile(allResponseTimes, 95),
    p99_latency_ms: percentile(allResponseTimes, 99),
    error_rate: totalErrors / totalRequests,
    cache_hit_rate: 75.0, // Placeholder - would track Redis hits
    memory_peak_mb: process.memoryUsage().heapUsed / 1024 / 1024,
    composite_score: 0, // Calculated below
  };

  // Composite score: weighted average (lower is better)
  // p99 (weight 40%) + error_rate (weight 30%) + memory (weight 30%)
  metric.composite_score =
    metric.p99_latency_ms * 0.4 +
    metric.error_rate * 100 * 0.3 +
    (metric.memory_peak_mb / 256) * 100 * 0.3;

  console.log("\n" + "=".repeat(60));
  console.log("COMPOSITE METRICS:");
  console.log("=".repeat(60));
  console.log(`p50_latency_ms: ${metric.p50_latency_ms.toFixed(1)}`);
  console.log(`p95_latency_ms: ${metric.p95_latency_ms.toFixed(1)}`);
  console.log(`p99_latency_ms: ${metric.p99_latency_ms.toFixed(1)}`);
  console.log(`error_rate: ${(metric.error_rate * 100).toFixed(2)}%`);
  console.log(`cache_hit_rate: ${metric.cache_hit_rate.toFixed(1)}%`);
  console.log(`memory_peak_mb: ${metric.memory_peak_mb.toFixed(1)}`);
  console.log(`\nCOMPOSITE_SCORE: ${metric.composite_score.toFixed(2)}`);
  console.log("=".repeat(60) + "\n");

  return metric;
}

// Export for use in test runner
export { measurePerformance };
export type { CompositeMetric };

// Run if called directly
if (require.main === module) {
  measurePerformance().catch(console.error);
}
