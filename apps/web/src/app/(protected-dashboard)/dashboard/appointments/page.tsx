import { next14Days } from "@radevu/shared";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AppointmentsFilters,
  type AppointmentsFilterDate
} from "@/components/dashboard/AppointmentsFilters";
import { AppointmentList } from "@/components/dashboard/AppointmentList";
import { DayHeader } from "@/components/dashboard/DayHeader";
import {
  cancelAppointment,
  markAppointmentDone,
  postAppointmentOwnerMessage,
  saveAppointmentPrivateNotes,
  togglePaid
} from "@/app/(protected-dashboard)/dashboard/today/actions";
import {
  type AppointmentWithRelations,
  listAppointments
} from "@/lib/appointments";
import { getOwnerBusiness } from "@/lib/dashboard-server";

export const dynamic = "force-dynamic";

type AppointmentsPageProps = {
  searchParams: Promise<{
    cursor?: string;
    date?: string;
    q?: string;
    view?: string;
  }>;
};

type DateParts = {
  day: number;
  month: number;
  year: number;
};

type AppointmentGroup = {
  date: Date;
  key: string;
  items: AppointmentWithRelations[];
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
    day: getPart("day"),
    month: getPart("month"),
    year: getPart("year")
  };
}

function dateISOInTimeZone(date: Date, timezone: string): string {
  const parts = datePartsInTimeZone(date, timezone);
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
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
  const [year = 0, month = 0, day = 0] = dateISO.split("-").map(Number);
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const initialUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstOffset = timeZoneOffsetMs(new Date(initialUtc), timezone);
  const firstUtc = initialUtc - firstOffset;
  const secondOffset = timeZoneOffsetMs(new Date(firstUtc), timezone);

  return new Date(initialUtc - secondOffset);
}

function addDays(dateISO: string, days: number): string {
  const [year = 0, month = 0, day = 0] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0, 0))
    .toISOString()
    .slice(0, 10);
}

function isDateISO(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function formatFilterLabel(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "short",
    timeZone: timezone,
    weekday: "short"
  }).format(date);
}

function buildFilterDates(timezone: string): AppointmentsFilterDate[] {
  return next14Days(timezone).map((date) => ({
    date: dateISOInTimeZone(date, timezone),
    label: formatFilterLabel(date, timezone)
  }));
}

function groupAppointments(
  items: AppointmentWithRelations[],
  timezone: string
): AppointmentGroup[] {
  const groups = new Map<string, AppointmentGroup>();

  for (const item of items) {
    const key = dateISOInTimeZone(item.startsAt, timezone);
    const existing = groups.get(key);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(key, {
      date: item.startsAt,
      key,
      items: [item]
    });
  }

  return Array.from(groups.values());
}

function loadMoreHref(
  searchParams: Awaited<AppointmentsPageProps["searchParams"]>,
  cursor: string
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  params.set("cursor", cursor);
  return `/dashboard/appointments?${params.toString()}`;
}

export default async function AppointmentsPage({
  searchParams
}: AppointmentsPageProps): Promise<JSX.Element> {
  const business = await getOwnerBusiness();

  if (!business) {
    redirect("/register");
  }

  const params = await searchParams;
  const view = params.view === "past" ? "past" : "upcoming";
  const selectedDate = isDateISO(params.date) ? params.date : null;
  const now = new Date();
  const from = selectedDate
    ? zonedDateTimeToUtc(selectedDate, "00:00", business.timezone)
    : view === "past"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60_000)
      : now;
  const to = selectedDate
    ? zonedDateTimeToUtc(addDays(selectedDate, 1), "00:00", business.timezone)
    : view === "past"
      ? new Date(now.getTime() + 30 * 24 * 60 * 60_000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60_000);
  const result = await listAppointments(business.id, {
    cursor: params.cursor,
    customerQuery: params.q,
    from,
    status: view === "past" ? ["done", "cancelled"] : ["scheduled"],
    take: 50,
    to
  });
  const items =
    view === "past"
      ? [...result.items].sort(
          (left, right) => right.startsAt.getTime() - left.startsAt.getTime()
        )
      : result.items;
  const groups = groupAppointments(items, business.timezone);
  const emptyMessage =
    view === "past"
      ? "Î”ÎµÎ½ Î²ÏÎ­Î¸Î·ÎºÎ±Î½ Ï€Î±Î»Î¹Î­Ï‚ ÎºÏÎ±Ï„Î®ÏƒÎµÎ¹Ï‚ Î¼Îµ Î±Ï…Ï„Î¬ Ï„Î± Ï†Î¯Î»Ï„ÏÎ±."
      : "Î”ÎµÎ½ Î­Ï‡ÎµÎ¹Ï‚ ÎµÏ€ÏŒÎ¼ÎµÎ½ÎµÏ‚ ÎºÏÎ±Ï„Î®ÏƒÎµÎ¹Ï‚ ÎµÎ´ÏŽ. ÎšÏÎ¬Ï„Î± Î»Î¯Î³Î¿ Ï‡ÏŽÏÎ¿ Î³Î¹Î± Î±Î½Î¬ÏƒÎ±.";

  return (
    <section className="flex flex-col gap-4 pb-20">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          ÎšÏÎ±Ï„Î®ÏƒÎµÎ¹Ï‚
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Î’ÏÎµÏ‚ Î³ÏÎ®Î³Î¿ÏÎ± Ï€Î¿Î¹Î¿Ï‚ Î­ÏÏ‡ÎµÏ„Î±Î¹ ÎºÎ±Î¹ Ï„Î¹ Ï‡ÏÎµÎ¹Î¬Î¶ÎµÏ„Î±Î¹.
        </p>
      </div>
      <AppointmentsFilters
        dates={buildFilterDates(business.timezone)}
        query={params.q ?? ""}
        selectedDate={selectedDate}
        view={view}
      />
      {groups.length === 0 ? (
        <AppointmentList
          emptyMessage={emptyMessage}
          items={[]}
          onCancel={cancelAppointment}
          onMarkDone={markAppointmentDone}
          onPostMessage={postAppointmentOwnerMessage}
          onSavePrivateNotes={saveAppointmentPrivateNotes}
          onTogglePaid={togglePaid}
          timezone={business.timezone}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section className="flex flex-col gap-3" key={group.key}>
              <DayHeader
                count={group.items.length}
                date={group.date}
                timezone={business.timezone}
              />
              <AppointmentList
                emptyMessage={emptyMessage}
                items={group.items}
                onCancel={cancelAppointment}
                onMarkDone={markAppointmentDone}
                onPostMessage={postAppointmentOwnerMessage}
                onSavePrivateNotes={saveAppointmentPrivateNotes}
                onTogglePaid={togglePaid}
                timezone={business.timezone}
              />
            </section>
          ))}
        </div>
      )}
      {result.nextCursor ? (
        <Button asChild className="w-full" variant="outline">
          <Link href={loadMoreHref(params, result.nextCursor)}>
            Î¦ÏŒÏÏ„Ï‰ÏƒÎµ ÎºÎ¹ Î¬Î»Î»Î±
          </Link>
        </Button>
      ) : null}
    </section>
  );
}
