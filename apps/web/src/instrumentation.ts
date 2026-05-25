/**
 * Registers Node.js-only process hooks for the Next.js runtime.
 *
 * @returns Resolves after optional worker startup.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { startReminderWorker } = await import("./lib/reminder-worker");
  startReminderWorker();
}
