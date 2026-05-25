"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type IntervalValue = {
  close: string;
  open: string;
};

type IntervalRowProps = {
  interval: IntervalValue;
  onChange: (interval: IntervalValue) => void;
  onRemove: () => void;
};

/**
 * Renders one editable working-hours interval.
 *
 * @param props - Current interval and change/remove callbacks.
 * @returns A native time-input interval row.
 */
export function IntervalRow({
  interval,
  onChange,
  onRemove
}: IntervalRowProps): JSX.Element {
  return (
    <div className="grid grid-cols-[1fr_1fr_44px] items-end gap-2">
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Από
        <Input
          onChange={(event) =>
            onChange({
              ...interval,
              open: event.currentTarget.value
            })
          }
          step={900}
          type="time"
          value={interval.open}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Έως
        <Input
          onChange={(event) =>
            onChange({
              ...interval,
              close: event.currentTarget.value
            })
          }
          step={900}
          type="time"
          value={interval.close}
        />
      </label>
      <Button
        aria-label="Αφαίρεση ωραρίου"
        onClick={onRemove}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X aria-hidden="true" className="h-5 w-5" />
      </Button>
    </div>
  );
}
