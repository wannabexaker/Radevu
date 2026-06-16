"use client";

import { ChevronLeft } from "lucide-react";
import { useReducer } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StepConfirmation } from "./StepConfirmation";
import { StepContactForm } from "./StepContactForm";
import { StepDatePicker } from "./StepDatePicker";
import { StepServicePicker } from "./StepServicePicker";
import { StepSlotPicker } from "./StepSlotPicker";

export type BookingBusiness = {
  id: string;
  name: string;
  timezone: string;
  workingHours: unknown;
};

export type BookingService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  description: string | null;
};

export type BookingSlot = {
  starts_at: string;
  ends_at: string;
};

export type BookingPrefill = {
  email: string;
  name: string;
  phone: string | null;
};

export type ConfirmedAppointment = {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "done" | "cancelled";
  paid: boolean;
  amount_due_cents: number;
  currency: string;
  customer_name: string;
  service_name: string;
};

type Step = "service" | "date" | "slot" | "contact" | "confirmation";

type BookingState = {
  step: Step;
  service: BookingService | null;
  date: Date | null;
  slot: BookingSlot | null;
  appointment: ConfirmedAppointment | null;
  customerEmail: string | null;
  customerManageUrl: string | null;
};

type BookingAction =
  | {
      type: "select_service";
      service: BookingService;
    }
  | {
      type: "select_date";
      date: Date;
    }
  | {
      type: "select_slot";
      slot: BookingSlot;
    }
  | {
      type: "confirm";
      appointment: ConfirmedAppointment;
      customerEmail: string | null;
      customerManageUrl: string | null;
    }
  | {
      type: "back";
    };

type BookingFlowProps = {
  business: BookingBusiness;
  onClose: () => void;
  prefill?: BookingPrefill | null;
  services: BookingService[];
};

const initialState: BookingState = {
  step: "service",
  service: null,
  date: null,
  slot: null,
  appointment: null,
  customerEmail: null,
  customerManageUrl: null
};

function dateISOFromDate(date: Date): string {
  return `${date.getUTCFullYear().toString().padStart(4, "0")}-${(
    date.getUTCMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`;
}

function reducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "select_service":
      return {
        ...state,
        appointment: null,
        customerEmail: null,
        customerManageUrl: null,
        date: null,
        service: action.service,
        slot: null,
        step: "date"
      };
    case "select_date":
      return {
        ...state,
        appointment: null,
        customerEmail: null,
        customerManageUrl: null,
        date: action.date,
        slot: null,
        step: "slot"
      };
    case "select_slot":
      return {
        ...state,
        appointment: null,
        customerEmail: null,
        customerManageUrl: null,
        slot: action.slot,
        step: "contact"
      };
    case "confirm":
      return {
        ...state,
        appointment: action.appointment,
        customerEmail: action.customerEmail,
        customerManageUrl: action.customerManageUrl,
        step: "confirmation"
      };
    case "back":
      if (state.step === "date") {
        return {
          ...state,
          date: null,
          service: null,
          slot: null,
          step: "service"
        };
      }

      if (state.step === "slot") {
        return {
          ...state,
          date: null,
          slot: null,
          step: "date"
        };
      }

      if (state.step === "contact") {
        return {
          ...state,
          slot: null,
          step: "slot"
        };
      }

      return state;
    default:
      return state;
  }
}

function stepIndex(step: Step): number {
  return ["service", "date", "slot", "contact", "confirmation"].indexOf(step);
}

export function BookingFlow({
  business,
  onClose,
  prefill,
  services
}: BookingFlowProps): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState);
  const currentIndex = stepIndex(state.step);
  const canGoBack = state.step !== "service" && state.step !== "confirmation";

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        {canGoBack ? (
          <Button
            onClick={() => dispatch({ type: "back" })}
            size="sm"
            type="button"
            variant="ghost"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            Πίσω
          </Button>
        ) : (
          <div className="min-h-10" />
        )}
        <div
          aria-label={`Βήμα ${currentIndex + 1} από 5`}
          className="flex items-center gap-2"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <span
              className={cn(
                "h-2 w-2 rounded-full bg-slate-200",
                index <= currentIndex && "bg-indigo-500"
              )}
              key={index}
            />
          ))}
        </div>
      </div>

      {state.step === "service" ? (
        <StepServicePicker
          onSelect={(service) => dispatch({ type: "select_service", service })}
          services={services}
        />
      ) : null}

      {state.step === "date" && state.service ? (
        <StepDatePicker
          businessId={business.id}
          onDateSelect={(date) => dispatch({ type: "select_date", date })}
          service={state.service}
          timezone={business.timezone}
        />
      ) : null}

      {state.step === "slot" && state.service && state.date ? (
        <StepSlotPicker
          businessId={business.id}
          dateISO={dateISOFromDate(state.date)}
          onBack={() => dispatch({ type: "back" })}
          onSelect={(slot) => dispatch({ type: "select_slot", slot })}
          service={state.service}
          timezone={business.timezone}
        />
      ) : null}

      {state.step === "contact" &&
      state.service &&
      state.date &&
      state.slot ? (
        <StepContactForm
          businessId={business.id}
          onConfirmed={(appointment, customerEmail, customerManageUrl) =>
            dispatch({
              type: "confirm",
              appointment,
              customerEmail,
              customerManageUrl
            })
          }
          service={state.service}
          slot={state.slot}
          prefill={prefill}
          timezone={business.timezone}
        />
      ) : null}

      {state.step === "confirmation" && state.appointment ? (
        <StepConfirmation
          appointment={state.appointment}
          businessName={business.name}
          customerEmail={state.customerEmail}
          customerManageUrl={state.customerManageUrl}
          onClose={onClose}
          timezone={business.timezone}
        />
      ) : null}
    </div>
  );
}
