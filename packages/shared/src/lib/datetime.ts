const DEFAULT_TIMEZONE = "Europe/Athens";

const greekDateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const greekTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const greekDateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const greekMonthFormatter = new Intl.DateTimeFormat("el-GR", {
  month: "long",
  timeZone: "UTC",
  year: "numeric"
});
const greekDayShortFormatter = new Intl.DateTimeFormat("el-GR", {
  timeZone: "UTC",
  weekday: "short"
});

type DateParts = {
  year: number;
  month: number;
  day: number;
};

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

function formatterFromCache(
  cache: Map<string, Intl.DateTimeFormat>,
  timezone: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  const cached = cache.get(timezone);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("el-GR", {
    ...options,
    timeZone: timezone
  });
  cache.set(timezone, formatter);
  return formatter;
}

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

function timeZoneOffsetMs(date: Date, timezone: string): number {
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

  const asUtc = Date.UTC(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
    getPart("hour"),
    getPart("minute"),
    getPart("second")
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(
  dateISO: string,
  time: string,
  timezone: string
): Date {
  const { day, month, year } = parseDateISO(dateISO);
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const initialUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstOffset = timeZoneOffsetMs(new Date(initialUtc), timezone);
  const firstUtc = initialUtc - firstOffset;
  const secondOffset = timeZoneOffsetMs(new Date(firstUtc), timezone);

  return new Date(initialUtc - secondOffset);
}

function isoDateInTimeZone(date: Date, timezone: string): string {
  const parts = datePartsInTimeZone(date, timezone);
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

function isoDateFromParts(parts: DateParts): string {
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Formats a date in Greek using the provided business timezone.
 *
 * @param date - Date to format.
 * @param timezone - IANA timezone; defaults to Europe/Athens.
 * @returns Greek weekday, day, and month text.
 */
export function formatGreekDate(
  date: Date,
  timezone = DEFAULT_TIMEZONE
): string {
  return formatterFromCache(greekDateFormatterCache, timezone, {
    day: "numeric",
    month: "long",
    weekday: "long"
  }).format(date);
}

/**
 * Formats a time in Greek 24-hour style using the provided business timezone.
 *
 * @param date - Date to format.
 * @param timezone - IANA timezone; defaults to Europe/Athens.
 * @returns Time formatted as HH:MM.
 */
export function formatGreekTime(
  date: Date,
  timezone = DEFAULT_TIMEZONE
): string {
  return formatterFromCache(greekTimeFormatterCache, timezone, {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit"
  }).format(date);
}

/**
 * Formats a date and time in Greek using the provided business timezone.
 *
 * @param date - Date to format.
 * @param timezone - IANA timezone; defaults to Europe/Athens.
 * @returns Greek date and 24-hour time.
 */
export function formatGreekDateTime(
  date: Date,
  timezone = DEFAULT_TIMEZONE
): string {
  return formatterFromCache(greekDateTimeFormatterCache, timezone, {
    day: "numeric",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "long",
    weekday: "long"
  }).format(date);
}

/**
 * Formats a UTC month anchor as a Greek calendar month heading.
 *
 * @param date - Date anchored inside the month to format.
 * @returns Greek month and year, for example "Μάιος 2026".
 */
export function formatGreekMonth(date: Date): string {
  return greekMonthFormatter.format(date);
}

/**
 * Formats a UTC day anchor as a short Greek weekday label.
 *
 * @param date - Date anchored on the weekday to format.
 * @returns Greek short weekday without a trailing period, for example "Δευ".
 */
export function formatGreekDayShort(date: Date): string {
  return greekDayShortFormatter.format(date).replace(".", "");
}

/**
 * Adds minutes to a date without mutating the original instance.
 *
 * @param date - Base date.
 * @param minutes - Minutes to add.
 * @returns A new date shifted by the given minutes.
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/**
 * Builds every day in a business-local calendar month.
 *
 * @param year - Four-digit year.
 * @param month - One-based month number.
 * @param timezone - IANA timezone used by the business.
 * @returns Date objects anchored at local noon for each day in the month.
 */
export function getMonthDays(
  year: number,
  month: number,
  timezone: string
): Date[] {
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const dateISO = isoDateFromParts({
      year,
      month,
      day: index + 1
    });
    return zonedDateTimeToUtc(dateISO, "12:00", timezone);
  });
}

/**
 * Checks whether a date is before today in the business timezone.
 *
 * @param date - Date to compare.
 * @param timezone - IANA timezone used by the business.
 * @returns True when the date is before today in that timezone.
 */
export function isPast(date: Date, timezone: string): boolean {
  return isoDateInTimeZone(date, timezone) < isoDateInTimeZone(new Date(), timezone);
}

/**
 * Checks whether a date is today in the business timezone.
 *
 * @param date - Date to compare.
 * @param timezone - IANA timezone used by the business.
 * @returns True when the date is today in that timezone.
 */
export function isToday(date: Date, timezone: string): boolean {
  return isoDateInTimeZone(date, timezone) === isoDateInTimeZone(new Date(), timezone);
}

/**
 * Adds calendar months while keeping the result anchored safely at UTC noon.
 *
 * @param date - Base date.
 * @param n - Number of months to add; negative values subtract months.
 * @returns A new date shifted by the requested number of calendar months.
 */
export function addMonths(date: Date, n: number): Date {
  const targetMonthStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1, 12)
  );
  const clampedDay = Math.min(
    date.getUTCDate(),
    daysInMonth(
      targetMonthStart.getUTCFullYear(),
      targetMonthStart.getUTCMonth() + 1
    )
  );

  return new Date(
    Date.UTC(
      targetMonthStart.getUTCFullYear(),
      targetMonthStart.getUTCMonth(),
      clampedDay,
      12
    )
  );
}

/**
 * Builds the next 14 business-local dates from the server or browser clock.
 *
 * @param timezone - IANA timezone used by the business.
 * @returns Date objects representing noon in each business-local day.
 */
export function next14Days(timezone: string): Date[] {
  const today = datePartsInTimeZone(new Date(), timezone);
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day);

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(todayUtc + index * 24 * 60 * 60_000);
    const dateISO = isoDateInTimeZone(date, "UTC");
    return zonedDateTimeToUtc(dateISO, "12:00", timezone);
  });
}
