import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis() {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return globalForRedis.redis;
}

export async function ensureRedis() {
  const client = getRedis();
  if (client.status === "wait" || client.status === "end") {
    await client.connect();
  }
  return client;
}
