import Redis from "ioredis";
import { env } from "./env";

const globalForRedis = globalThis as typeof globalThis & {
  radevuRedis?: Redis;
};

export const redis =
  globalForRedis.radevuRedis ??
  new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3
  });

redis.on("error", (error) => {
  console.error("Redis client error", error);
});

if (env.NODE_ENV !== "production") {
  globalForRedis.radevuRedis = redis;
}
