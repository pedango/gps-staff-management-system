import { getRedis } from "@/lib/redis";
import {
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS as MAX_ATTEMPTS,
  LOGIN_RATE_LIMIT_WINDOW_SECONDS as WINDOW_SECONDS,
} from "@/lib/login-rate-constants";

/** Read-only check for middleware / auth route (does not increment failures). */
export async function peekLoginBlocked(ip: string): Promise<boolean> {
  const redis = getRedis();
  const key = `login:rl:${ip}`;
  if (redis) {
    const raw = await redis.get<string | number>(key);
    const count = typeof raw === "string" ? Number.parseInt(raw, 10) : raw ?? 0;
    return Number.isFinite(count) && count >= MAX_ATTEMPTS;
  }
  const store = memoryStore();
  const entry = store.get(ip);
  if (!entry) {
    return false;
  }
  if (entry.resetAt <= Date.now()) {
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export type LoginRateLimitHandle = {
  recordFailure: () => Promise<void>;
  reset: () => Promise<void>;
};

function memoryStore(): Map<string, { count: number; resetAt: number }> {
  const g = globalThis as unknown as { __gpsLoginRl?: Map<string, { count: number; resetAt: number }> };
  if (!g.__gpsLoginRl) g.__gpsLoginRl = new Map();
  return g.__gpsLoginRl;
}

export async function checkLoginRateLimit(ip: string): Promise<LoginRateLimitHandle | "blocked"> {
  const redis = getRedis();
  const key = `login:rl:${ip}`;

  if (redis) {
    const raw = await redis.get<string | number>(key);
    const count = typeof raw === "string" ? Number.parseInt(raw, 10) : raw ?? 0;
    if (Number.isFinite(count) && count >= MAX_ATTEMPTS) {
      return "blocked";
    }
    return {
      recordFailure: async () => {
        const n = await redis.incr(key);
        if (n === 1) {
          await redis.expire(key, WINDOW_SECONDS);
        }
      },
      reset: async () => {
        await redis.del(key);
      },
    };
  }

  const store = memoryStore();
  const now = Date.now();
  let entry = store.get(ip);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_SECONDS * 1000 };
    store.set(ip, entry);
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return "blocked";
  }
  return {
    recordFailure: async () => {
      const e = store.get(ip);
      if (e) e.count += 1;
    },
    reset: async () => {
      store.delete(ip);
    },
  };
}
