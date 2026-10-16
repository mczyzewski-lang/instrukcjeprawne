"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Drukuj" }: { label?: string }) {
  return (
    <button type="button" className="btn btn-primary" onClick={() => window.print()}>
      <Printer className="h-4 w-4" aria-hidden="true" /> {label}
    </button>
  );
}
