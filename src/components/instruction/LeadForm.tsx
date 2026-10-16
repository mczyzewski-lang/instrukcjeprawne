"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics-client";

interface Props {
  topic: string;
  partnerName: string;
  disclosure: string;
  askEmail: boolean;
  instructionSlug: string;
  instructionTitle: string;
  pathId?: string;
  pathName?: string;
}

type Errors = Partial<Record<"name" | "phone" | "email" | "contactConsent" | "form", string>>;

/**
 * Uniwersalny formularz kontaktu z ekspertem.
 * Minimum danych: imię, telefon, opcjonalnie e-mail. Temat i kontekst pobierane automatycznie z instrukcji.
 * Nie pytamy o szczegóły wrażliwe.
 */
export function LeadForm({ topic, partnerName, disclosure, askEmail, instructionSlug, instructionTitle, pathId, pathName }: Props) {
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [localNote, setLocalNote] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  const context = `Instrukcja: ${instructionTitle}${pathName ? ` · Droga: ${pathName}` : ""}`;

  const validate = (fd: FormData): Errors => {
    const e: Errors = {};
    const name = String(fd.get("name") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").replace(/[\s()-]/g, "");
    const email = String(fd.get("email") ?? "").trim();
    if (name.length < 2) e.name = "Podaj imię.";
    if (!/^(\+48)?\d{9}$/.test(phone) && !/^\+\d{8,15}$/.test(phone)) e.phone = "Podaj poprawny numer telefonu, np. 600 100 200.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = "Podaj poprawny adres e-mail albo zostaw pole puste.";
    if (!fd.get("contactConsent")) e.contactConsent = "Zaznacz zgodę, aby ekspert mógł się z Tobą skontaktować.";
    return e;
  };

  const submit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const e = validate(fd);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = ev.currentTarget.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email") || undefined,
          topic,
          instructionSlug,
          pathId,
          context,
          contactConsent: fd.get("contactConsent") === "on",
          website: fd.get("website") || undefined,
          startedAt: startedAt.current,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fieldErrors?: Errors; localMode?: boolean };
      if (!res.ok || !json.ok) {
        setErrors({ ...(json.fieldErrors ?? {}), form: json.error ?? "Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę." });
        setStatus("error");
      } else {
        track("lead_submitted", { instructionSlug, pathId, props: { topic } });
        setLocalNote(json.localMode ? "Tryb lokalny: zgłoszenie zapisano w bazie. Przekazanie do partnera nie jest skonfigurowane (zmienna webhooka)." : "");
        setStatus("done");
      }
    } catch {
      setErrors({ form: "Brak połączenia. Sprawdź internet i spróbuj ponownie." });
      setStatus("error");
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  };

  if (status === "done") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-md border border-navy bg-white p-5 outline-none">
        <p className="text-lg font-extrabold">Dziękujemy. Zgłoszenie zostało przyjęte.</p>
        <p className="mt-2 text-sm">
          Ekspert ({partnerName}) oddzwoni na podany numer. Rozmowa jest bezpłatna i do niczego nie zobowiązuje. Instrukcja na tej stronie pozostaje do
          Twojej dyspozycji.
        </p>
        {localNote && <p className="mt-3 text-xs text-muted">{localNote}</p>}
      </div>
    );
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`lead-${k}-err`} className="field-error">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form noValidate onSubmit={submit} className="grid gap-4" aria-describedby="lead-disclosure">
      <p id="lead-disclosure" className="rounded-md border border-line bg-canvas px-4 py-3 text-sm">
        {disclosure}
      </p>
      <p className="text-sm">
        <span className="font-bold">Temat:</span> {context}
      </p>
      <div>
        <label htmlFor="lead-name" className="field-label">
          Imię
        </label>
        <input id="lead-name" name="name" autoComplete="given-name" className="field-input" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "lead-name-err" : undefined} />
        {err("name")}
      </div>
      <div>
        <label htmlFor="lead-phone" className="field-label">
          Numer telefonu
        </label>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="field-input"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "lead-phone-err" : undefined}
        />
        {err("phone")}
      </div>
      {askEmail && (
        <div>
          <label htmlFor="lead-email" className="field-label">
            E-mail <span className="font-normal text-muted">(opcjonalnie)</span>
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            autoComplete="email"
            className="field-input"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "lead-email-err" : undefined}
          />
          {err("email")}
        </div>
      )}
      {/* pułapka na boty – niewidoczna dla ludzi i czytników ekranu */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="lead-website">Strona www</label>
        <input id="lead-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="contactConsent"
            className="mt-0.5 h-5 w-5 shrink-0 accent-navy"
            aria-invalid={Boolean(errors.contactConsent)}
            aria-describedby={errors.contactConsent ? "lead-contactConsent-err" : undefined}
          />
          <span>
            Proszę o kontakt telefoniczny{askEmail ? " lub e-mailowy" : ""} w tej sprawie i zgadzam się na przekazanie moich danych podmiotowi {partnerName} w tym
            celu.
          </span>
        </label>
        {err("contactConsent")}
      </div>
      <p className="text-xs text-muted">
        Twoje dane wykorzystamy wyłącznie do kontaktu w tej sprawie. Szczegóły, w tym Twoje prawa i okres przechowywania danych, znajdziesz w{" "}
        <a href="/polityka-prywatnosci#formularz" className="underline">
          polityce prywatności
        </a>
        . Nie podawaj tu szczegółów swojej sprawy – omówisz je w rozmowie.
      </p>
      <div ref={statusRef} tabIndex={-1} role="alert" className="outline-none empty:hidden">
        {errors.form && <p className="field-error text-base">{errors.form}</p>}
      </div>
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={status === "sending"}>
        {status === "sending" ? "Wysyłanie…" : "Poproś o bezpłatną rozmowę"}
      </button>
    </form>
  );
}
