import {
  addMinutes,
  getDayIntervals,
  parseWorkingHours
} from "@radevu/shared";

export type Slot = {
  startsAt: Date;
  endsAt: Date;
};

type BusinessForAvailability = {
  timezone: string;
  workingHours: unknown;
};

type ServiceForAvailability = {
  durationMinutes: number;
};

type AppointmentForAvailability = {
  startsAt: Date;
  endsAt: Date;
};

const SLOT_STEP_MINUTES = 15;
const MIN_BOOKING_NOTICE_MINUTES = 60;

function parseDateISO(dateISO: string): { day: number; month: number; year: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);

  if (!match) {
    throw new Error("Invalid dateISO format");
  }

  return {
    year: Number(match[1] ?? Number.NaN),
    month: Number(match[2] ?? Number.NaN),
    day: Number(match[3] ?? Number.NaN)
  };
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour = 0, minute = 0] = time.split(":").map(Number);

  return {
    hour,
    minute
  };
}

function wallClockParts(
  date: Date,
  timezone: string
): {
  day: number;
  hour: number;
  minute: number;
  month: number;
  year: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return value ? Number(value) : 0;
  };

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute")
  };
}

function timeZoneOffsetMs(date: Date, timezone: string): number {
  const parts = wallClockParts(date, timezone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    0,
    0
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(
  dateISO: string,
  time: string,
  timezone: string
): Date | null {
  const { day, month, year } = parseDateISO(dateISO);
  const { hour, minute } = parseTime(time);
  const initialUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const offsetCandidates = new Set([
    timeZoneOffsetMs(new Date(initialUtc - 24 * 60 * 60_000), timezone),
    timeZoneOffsetMs(new Date(initialUtc), timezone),
    timeZoneOffsetMs(new Date(initialUtc + 24 * 60 * 60_000), timezone)
  ]);
  const matches: Date[] = [];

  for (const offset of offsetCandidates) {
    const candidate = new Date(initialUtc - offset);
    const candidateParts = wallClockParts(candidate, timezone);

    if (
      candidateParts.year === year &&
      candidateParts.month === month &&
      candidateParts.day === day &&
      candidateParts.hour === hour &&
      candidateParts.minute === minute
    ) {
      matches.push(candidate);
    }
  }

  matches.sort((a, b) => a.getTime() - b.getTime());
  return matches[0] ?? null;
}

function wallClockSlotKey(date: Date, timezone: string): string {
  const parts = wallClockParts(date, timezone);
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}T${parts.hour
    .toString()
    .padStart(2, "0")}:${parts.minute.toString().padStart(2, "0")}`;
}

function localDateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function dayOfWeekFromDateISO(dateISO: string): number {
  const { day, month, year } = parseDateISO(dateISO);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function overlaps(
  candidate: Slot,
  appointment: AppointmentForAvailability
): boolean {
  return (
    candidate.startsAt.getTime() < appointment.endsAt.getTime() &&
    candidate.endsAt.getTime() > appointment.startsAt.getTime()
  );
}

/**
 * Generates bookable slots for one business day from working hours minus scheduled appointments.
 *
 * @param business - Business timezone and persisted working-hours JSON.
 * @param service - Service duration used to ensure the slot fits before closing.
 * @param dateISO - Business-local date in YYYY-MM-DD format.
 * @param existingAppointments - Scheduled appointments to exclude from availability.
 * @returns Available UTC slots formatted as Date objects for API serialization.
 *
 * Complexity: O(slots x existingAppointments). This is acceptable for Phase 1
 * because each request covers one business day at 15-minute granularity.
 */
export function generateSlots(
  business: BusinessForAvailability,
  service: ServiceForAvailability,
  dateISO: string,
  existingAppointments: AppointmentForAvailability[]
): Slot[] {
  const workingHours = parseWorkingHours(business.workingHours);
  const intervals = getDayIntervals(workingHours, dayOfWeekFromDateISO(dateISO));
  const now = new Date();
  const todayInBusinessTimezone = localDateInTimezone(now, business.timezone);
  // Chunk #8 increases owner planning notice from 15 to 60 minutes.
  const minStart =
    dateISO === todayInBusinessTimezone
      ? addMinutes(now, MIN_BOOKING_NOTICE_MINUTES)
      : null;

  const slots: Slot[] = [];
  const seenWallClockStarts = new Set<string>();

  for (const interval of intervals) {
    let startsAt = zonedDateTimeToUtc(dateISO, interval.open, business.timezone);
    const closesAt = zonedDateTimeToUtc(dateISO, interval.close, business.timezone);

    if (!startsAt || !closesAt || startsAt.getTime() >= closesAt.getTime()) {
      continue;
    }

    while (addMinutes(startsAt, service.durationMinutes).getTime() <= closesAt.getTime()) {
      const wallClockStart = wallClockSlotKey(startsAt, business.timezone);

      if (seenWallClockStarts.has(wallClockStart)) {
        startsAt = addMinutes(startsAt, SLOT_STEP_MINUTES);
        continue;
      }

      seenWallClockStarts.add(wallClockStart);

      const slot = {
        startsAt,
        endsAt: addMinutes(startsAt, service.durationMinutes)
      };

      const isFutureEnough =
        minStart === null || slot.startsAt.getTime() >= minStart.getTime();
      const isFree = existingAppointments.every(
        (appointment) => !overlaps(slot, appointment)
      );

      if (isFutureEnough && isFree) {
        slots.push(slot);
      }

      startsAt = addMinutes(startsAt, SLOT_STEP_MINUTES);
    }
  }

  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
