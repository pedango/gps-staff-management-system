import { Redis } from "@upstash/redis";

function isConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (!isConfigured()) return null;
  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return client;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  const value = await redis.get<T>(key);
  return value ?? null;
}

export async function setCached<T>(key: string, data: T, ttlSeconds = 60): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(key, data, { ex: ttlSeconds });
}

const MEMBERS_CACHE_PREFIX = "members:list:";

export function membersListCacheKey(queryString: string): string {
  return `${MEMBERS_CACHE_PREFIX}${queryString}`;
}

export async function invalidateMembersListCache(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const keys = await redis.keys(`${MEMBERS_CACHE_PREFIX}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
