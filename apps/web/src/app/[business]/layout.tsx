import type { ReactNode } from "react";

export default function BusinessLayout({
  children
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );
}
