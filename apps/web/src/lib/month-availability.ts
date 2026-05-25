import {
  getDayIntervals,
  getMonthDays,
  isPast,
  parseWorkingHours,
  type MonthAvailabilityDTO,
  type MonthAvailabilityDayDTO
} from "@radevu/shared";
import { generateSlots } from "@/lib/availability";
import { prisma } from "@/lib/db";

type BusinessForMonthAvailability = {
  id: string;
  timezone: string;
  workingHours: unknown;
};

type ServiceForMonthAvailability = {
  durationMinutes: number;
};

type DateParts = {
  day: number;
  month: number;
  year: number;
};

function datePartsInTimeZone(date: Date, timezone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
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
    day: getPart("day")
  };
}

function dateISOFromParts(parts: DateParts): string {
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

function parseDateISO(dateISO: string): DateParts {
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

function dateISOInTimeZone(date: Date, timezone: string): string {
  return dateISOFromParts(datePartsInTimeZone(date, timezone));
}

function addCalendarDaysISO(dateISO: string, days: number): string {
  const parts = parseDateISO(dateISO);
  const shifted = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days, 12)
  );

  return dateISOFromParts({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate()
  });
}

function monthRangeUtc(year: number, month: number): { from: Date; to: Date } {
  return {
    from: new Date(Date.UTC(year, month - 1, 1) - 14 * 60 * 60_000),
    to: new Date(Date.UTC(year, month, 1) + 14 * 60 * 60_000)
  };
}

function dateISOFromDate(date: Date, timezone: string): string {
  return dateISOInTimeZone(date, timezone);
}

function dayOfWeekFromDateISO(dateISO: string): number {
  const parts = parseDateISO(dateISO);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

function stateFromSlotCount(slotCount: number): MonthAvailabilityDayDTO["state"] {
  if (slotCount === 0) {
    return "full";
  }

  if (slotCount <= 3) {
    return "tight";
  }

  if (slotCount <= 10) {
    return "available";
  }

  return "open";
}

/**
 * Computes availability density for every day in one business-local month.
 *
 * @param business - Business id, timezone, and working hours.
 * @param service - Service duration used to generate bookable slots.
 * @param year - Four-digit year for the requested month.
 * @param month - One-based month number for the requested month.
 * @returns Month availability days with slot counts and density states.
 */
export async function getMonthAvailability(
  business: BusinessForMonthAvailability,
  service: ServiceForMonthAvailability,
  year: number,
  month: number
): Promise<MonthAvailabilityDTO> {
  const workingHours = parseWorkingHours(business.workingHours);
  const { from, to } = monthRangeUtc(year, month);
  const now = new Date();
  const maxStartAt = new Date(now.getTime() + 90 * 24 * 60 * 60_000);
  const todayISO = dateISOInTimeZone(now, business.timezone);
  const maxDateISO = addCalendarDaysISO(todayISO, 90);
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      startsAt: {
        gte: from,
        lt: to
      },
      status: "scheduled"
    },
    select: {
      startsAt: true,
      endsAt: true
    }
  });

  const days = getMonthDays(year, month, business.timezone).map((date) => {
    const dateISO = dateISOFromDate(date, business.timezone);
    const intervals = getDayIntervals(
      workingHours,
      dayOfWeekFromDateISO(dateISO)
    );

    if (
      isPast(date, business.timezone) ||
      dateISO < todayISO ||
      dateISO > maxDateISO ||
      intervals.length === 0
    ) {
      return {
        date: dateISO,
        slot_count: 0,
        state: "closed" as const
      };
    }

    const slotCount = generateSlots(
      business,
      service,
      dateISO,
      existingAppointments
    ).filter((slot) => slot.startsAt.getTime() <= maxStartAt.getTime()).length;

    return {
      date: dateISO,
      slot_count: slotCount,
      state: stateFromSlotCount(slotCount)
    };
  });

  return {
    days
  };
}
