type PaidPillProps = {
  amountDueCents: number;
  currency: string;
  paid: boolean;
};

function formatPrice(amountDueCents: number, currency: string): string {
  const amount = amountDueCents / 100;

  if (currency === "EUR" && Number.isInteger(amount)) {
    return `€${amount}`;
  }

  return new Intl.NumberFormat("el-GR", {
    currency,
    style: "currency"
  }).format(amount);
}

/**
 * Renders a paid or amount-due badge for an appointment.
 *
 * @param props - Paid state, amount, and currency.
 * @returns A Greek payment badge.
 */
export function PaidPill({
  amountDueCents,
  currency,
  paid
}: PaidPillProps): JSX.Element {
  if (paid) {
    return (
      <span className="inline-flex min-h-7 items-center rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
        Πληρώθηκε
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-500">
      Οφείλει {formatPrice(amountDueCents, currency)}
    </span>
  );
}
