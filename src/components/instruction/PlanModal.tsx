"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Okno planu (natywny <dialog>: pułapka fokusu, Esc, tło strony nieaktywne).
 * Treść przewija się w środku – widać, gdzie plan się kończy – a na dole jest przyklejony pasek akcji.
 */
export function PlanModal({ open, title, onClose, footer, children }: { open: boolean; title: string; onClose: () => void; footer?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="no-print m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-navy/40 sm:m-auto sm:h-[min(92vh,60rem)] sm:max-w-3xl sm:p-0"
    >
      {open && (
        <div className="flex h-full flex-col overflow-hidden bg-white sm:rounded-md sm:border sm:border-line">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 sm:px-7">
            <p className="truncate text-sm font-extrabold">{title}</p>
            <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm hover:bg-canvas" aria-label="Zamknij plan">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && <div className="border-t border-line bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-7">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
