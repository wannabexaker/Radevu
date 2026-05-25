import Redis from "ioredis";

/** Redis sorted-set key that stores reminder appointment ids by fire time. */
export const REMINDER_QUEUE_KEY = "radevu:reminders";

type ReminderRedisGlobal = typeof globalThis & {
  __radevu_reminder_redis__?: Redis;
};

const globalForReminderRedis = globalThis as ReminderRedisGlobal;

const claimDueLua = `
local ids = redis.call("ZRANGEBYSCORE", KEYS[1], "-inf", ARGV[1], "LIMIT", 0, ARGV[2])
if #ids > 0 then
  redis.call("ZREM", KEYS[1], unpack(ids))
end
return ids
`;

function getRedisUrl(): string {
  return process.env.REDIS_URL ?? "redis://localhost:6379";
}

function reminderRedis(): Redis {
  if (!globalForReminderRedis.__radevu_reminder_redis__) {
    const client = new Redis(getRedisUrl(), {
      lazyConnect: true,
      maxRetriesPerRequest: 3
    });

    client.on("error", (error) => {
      console.error("[reminder-queue] Redis client error", {
        error
      });
    });

    globalForReminderRedis.__radevu_reminder_redis__ = client;
  }

  return globalForReminderRedis.__radevu_reminder_redis__;
}

function resultToAppointmentIds(result: unknown): string[] {
  if (!Array.isArray(result)) {
    return [];
  }

  return result.filter((item): item is string => typeof item === "string");
}

/**
 * Enqueues a reminder for an appointment at a specific timestamp.
 *
 * @param input - Appointment id and fire time.
 * @returns Resolves when the Redis sorted set has been updated.
 */
export async function enqueueReminder(input: {
  appointmentId: string;
  fireAt: Date;
}): Promise<void> {
  const score = input.fireAt.getTime();
  const redis = reminderRedis();

  await redis
    .multi()
    .zadd(REMINDER_QUEUE_KEY, "NX", score, input.appointmentId)
    .zadd(REMINDER_QUEUE_KEY, "XX", "GT", score, input.appointmentId)
    .exec();
}

/**
 * Removes a pending reminder for an appointment.
 *
 * @param appointmentId - Appointment id to remove from the queue.
 * @returns Resolves when Redis has processed the removal.
 */
export async function cancelReminder(appointmentId: string): Promise<void> {
  await reminderRedis().zrem(REMINDER_QUEUE_KEY, appointmentId);
}

/**
 * Atomically claims due reminders up to the requested limit.
 *
 * @param now - Upper bound for due reminder fire times.
 * @param limit - Maximum number of appointment ids to claim.
 * @returns Claimed appointment ids removed from the queue.
 */
export async function fetchDue(now: Date, limit: number): Promise<string[]> {
  if (limit <= 0) {
    return [];
  }

  const result = await reminderRedis().eval(
    claimDueLua,
    1,
    REMINDER_QUEUE_KEY,
    now.getTime(),
    limit
  );

  return resultToAppointmentIds(result);
}

/**
 * Closes the shared Redis queue client for unit test teardown.
 *
 * @returns Resolves after the client has been disconnected if it exists.
 */
export async function disconnectReminderQueueForTests(): Promise<void> {
  const client = globalForReminderRedis.__radevu_reminder_redis__;

  if (!client) {
    return;
  }

  globalForReminderRedis.__radevu_reminder_redis__ = undefined;
  client.disconnect();
}
