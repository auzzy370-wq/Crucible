import { ensureRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";

export async function rateLimit(key: string, max = Number(process.env.RATE_LIMIT_MAX ?? 120), windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000)) {
  try {
    const redis = await ensureRedis();
    const bucket = `rl:${key}`;
    const count = await redis.incr(bucket);
    if (count === 1) await redis.pexpire(bucket, windowMs);
    if (count > max) throw new AppError("Rate limit exceeded", 429, "RATE_LIMITED");
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Fail open if Redis is unavailable in local/dev.
  }
}
