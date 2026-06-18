import { redirect } from "next/navigation";
import { AppointmentList } from "@/components/dashboard/AppointmentList";
import { DayHeader } from "@/components/dashboard/DayHeader";
import { TodayHeader } from "@/components/dashboard/TodayHeader";
import {
  TodayRangeSelector
} from "@/components/dashboard/TodayRangeSelector";
import {
  todayRangeOptions,
  type TodayRangeDays
} from "@/components/dashboard/today-range";
import {
  cancelAppointment,
  markAppointmentDone,
  postAppointmentOwnerMessage,
  saveAppointmentPrivateNotes,
  togglePaid
} from "@/app/(protected-dashboard)/dashboard/today/actions";
import {
  type AppointmentWithRelations,
  getUpcomingDashboardAppointments
} from "@/lib/appointments";
import { getOwnerBusiness } from "@/lib/dashboard-server";

export const dynamic = "force-dynamic";

type TodayPageProps = {
  searchParams: Promise<{
    range?: string;
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

function parseRange(value: string | undefined): TodayRangeDays {
  const numericValue = Number(value);
  const match = todayRangeOptions.find((option) => option === numericValue);
  return match ?? 7;
}

function rangeLabel(rangeDays: TodayRangeDays): string {
  return rangeDays === 30 ? "τον επόμενο μήνα" : `τις επόμενες ${rangeDays} ημέρες`;
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

export default async function TodayPage({
  searchParams
}: TodayPageProps): Promise<JSX.Element> {
  const business = await getOwnerBusiness();

  if (!business) {
    redirect("/register");
  }

  const params = await searchParams;
  const selectedRange = parseRange(params.range);
  const items = await getUpcomingDashboardAppointments(
    business.id,
    business.timezone,
    selectedRange
  );
  const groups = groupAppointments(items, business.timezone);
  const counters = {
    total: items.length,
    done: items.filter((item) => item.status === "done").length,
    cancelled: items.filter((item) => item.status === "cancelled").length
  };

  return (
    <section className="flex flex-col gap-6 pb-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Πρόγραμμα
        </h1>
        <p className="text-base leading-relaxed text-slate-500">
          Δες τι έρχεται και κάνε τις βασικές κινήσεις γρήγορα.
        </p>
      </header>
      <TodayRangeSelector selectedRange={selectedRange} />
      <TodayHeader counters={counters} rangeDays={selectedRange} />
      {groups.length === 0 ? (
        <AppointmentList
          emptyMessage={`Δεν υπάρχουν κρατήσεις για ${rangeLabel(
            selectedRange
          )}.`}
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
                emptyMessage=""
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
    </section>
  );
}
