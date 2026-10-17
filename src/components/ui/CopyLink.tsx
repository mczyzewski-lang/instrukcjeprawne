"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/**
 * Adres strony zewnętrznej bez wychodzenia z serwisu: tekst + przycisk kopiowania adresu do schowka.
 * Czytelnik wkleja go sam, kiedy jest gotowy – nie wyrzucamy go z instrukcji w połowie.
 */
export function CopyLink({ url, label, className = "" }: { url: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const text = label ?? url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // starsze przeglądarki / brak uprawnień – kopiowanie przez zaznaczenie
      const t = document.createElement("textarea");
      t.value = url;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 ${className}`}>
      <span className="min-w-0 break-words" title={url}>{text}</span>
      <button
        type="button"
        onClick={copy}
        className="no-print inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted opacity-70 hover:bg-canvas hover:text-navy hover:opacity-100 focus-visible:opacity-100"
        aria-label={copied ? "Skopiowano adres" : `Kopiuj adres: ${url}`}
        title={copied ? "Skopiowano" : "Kopiuj adres"}
      >
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />}
      </button>
      <span role="status" className="sr-only">{copied ? "Adres skopiowany do schowka" : ""}</span>
      {copied && <span aria-hidden="true" className="text-xs text-muted">skopiowano</span>}
    </span>
  );
}
