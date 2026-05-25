import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import Redis from "ioredis";

type ReminderQueueModule = typeof import("../../src/lib/reminder-queue");

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

async function loadReminderQueue(): Promise<ReminderQueueModule> {
  const moduleUrl = new URL(
    "../../src/lib/reminder-queue.ts",
    import.meta.url
  ).href;

  return (await import(moduleUrl)) as ReminderQueueModule;
}

async function redisOrSkip(t: TestContext): Promise<Redis | null> {
  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });
  redis.on("error", () => undefined);

  try {
    await redis.ping();
    return redis;
  } catch (error) {
    console.warn("Skipping reminder queue test because Redis is unavailable", {
      error
    });
    redis.disconnect();
    t.skip("Redis is unavailable.");
    return null;
  }
}

test("reminder queue enqueues, orders, cancels, and claims atomically", async (t) => {
  const redis = await redisOrSkip(t);

  if (!redis) {
    return;
  }

  const {
    cancelReminder,
    disconnectReminderQueueForTests,
    enqueueReminder,
    fetchDue,
    REMINDER_QUEUE_KEY
  } = await loadReminderQueue();
  const now = Date.now();
  const earlyId = `queue_test_early_${now}`;
  const lateId = `queue_test_late_${now}`;
  const cancelledId = `queue_test_cancelled_${now}`;
  const doubleId = `queue_test_double_${now}`;
  const futureId = `queue_test_future_${now}`;

  try {
    await redis.del(REMINDER_QUEUE_KEY);

    await enqueueReminder({
      appointmentId: lateId,
      fireAt: new Date(now + 200)
    });
    await enqueueReminder({
      appointmentId: earlyId,
      fireAt: new Date(now + 100)
    });
    await enqueueReminder({
      appointmentId: futureId,
      fireAt: new Date(now + 10_000)
    });
    await enqueueReminder({
      appointmentId: cancelledId,
      fireAt: new Date(now + 50)
    });
    await cancelReminder(cancelledId);

    await enqueueReminder({
      appointmentId: doubleId,
      fireAt: new Date(now + 500)
    });
    await enqueueReminder({
      appointmentId: doubleId,
      fireAt: new Date(now + 300)
    });
    assert.equal(await redis.zscore(REMINDER_QUEUE_KEY, doubleId), String(now + 500));

    await enqueueReminder({
      appointmentId: doubleId,
      fireAt: new Date(now + 700)
    });
    assert.equal(await redis.zscore(REMINDER_QUEUE_KEY, doubleId), String(now + 700));

    const claimed = await fetchDue(new Date(now + 300), 10);
    assert.deepEqual(claimed, [earlyId, lateId]);

    const [firstConcurrentClaim, secondConcurrentClaim] = await Promise.all([
      fetchDue(new Date(now + 800), 10),
      fetchDue(new Date(now + 800), 10)
    ]);
    const concurrentIds = [
      ...firstConcurrentClaim,
      ...secondConcurrentClaim
    ].sort();
    assert.deepEqual(concurrentIds, [doubleId]);

    const remaining = await redis.zrange(REMINDER_QUEUE_KEY, 0, -1);
    assert.deepEqual(remaining, [futureId]);
  } finally {
    await redis.del(REMINDER_QUEUE_KEY);
    redis.disconnect();
    await disconnectReminderQueueForTests();
  }
});
