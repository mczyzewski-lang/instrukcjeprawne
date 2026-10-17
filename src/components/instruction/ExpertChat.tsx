"use client";

import { FileText, Mail, MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { store, track } from "@/lib/analytics-client";

export interface ChatExpert {
  name: string;
  title: string;
  photoUrl: string | null;
  placeholder: boolean;
  email: string | null;
}

interface Props {
  topic: string;
  partnerName: string;
  disclosure: string;
  instructionSlug: string;
  instructionTitle: string;
  pathId?: string;
  pathName?: string;
  expert: ChatExpert | null;
  /** zewnętrzna prośba o otwarcie (np. z wyboru „Z ekspertem” pod krokami) */
  openSignal?: number;
  /** „Plan …” dołączany do najbliższej wiadomości */
  attachment?: ChatAttachment | null;
  onAttachmentChange?: (a: ChatAttachment | null) => void;
}

export interface ChatAttachment {
  /** nazwa pliku bez .pdf, np. „Plan rozwodu – Marek (17.10.26)” */
  title: string;
  /** sama nazwa planu do treści wiadomości, np. „Plan rozwodu” */
  planTitle?: string;
  /** kod planu (z niego serwer odtwarza plan i PDF) */
  code: string;
  href: string;
  summary: string;
}

/** Karta pliku – „a'la PDF” w oknie czatu. */
function AttachmentCard({ title, href, summary, onRemove, tone = "light" }: { title: string; href: string; summary?: string; onRemove?: () => void; tone?: "light" | "dark" }) {
  return (
    <div data-attachment-target={onRemove ? "" : undefined} className={`flex items-center gap-3 rounded-md border px-3 py-2.5 ${tone === "dark" ? "border-white/30 bg-white/10" : "border-line bg-white"}`}>
      <span aria-hidden="true" className={`flex h-10 w-8 shrink-0 flex-col items-center justify-end rounded-sm border pb-1 text-[0.55rem] font-extrabold ${tone === "dark" ? "border-white/60" : "border-navy"}`}>
        <FileText className="mb-0.5 h-3.5 w-3.5" />
        PDF
      </span>
      <span className="min-w-0 flex-1">
        <a href={href} target="_blank" rel="noopener" className={`block truncate text-sm font-bold ${tone === "dark" ? "text-white" : ""}`}>
          {title}.pdf
        </a>
        {summary && <span className={`block truncate text-xs ${tone === "dark" ? "text-white/75" : "text-muted"}`}>{summary}</span>}
      </span>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Usuń załącznik ${title}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted hover:bg-canvas hover:text-navy">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

type Tab = "chat" | "email";

interface Msg {
  id: string;
  author: "user" | "expert" | "system";
  body: string;
  authorName?: string | null;
  attachment?: { title: string; href: string; summary?: string } | null;
}

const PREFIXES = ["+48", "+49", "+44", "+353", "+31", "+47", "+46", "+420", "+380", "+1"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const digitsOf = (v: string) => v.replace(/[\s()-]/g, "");

function Avatar({ expert, size = 40 }: { expert: ChatExpert | null; size?: number }) {
  if (expert?.photoUrl)
    // eslint-disable-next-line @next/next/no-img-element -- zdjęcie z lokalnego magazynu
    return <img src={expert.photoUrl} alt="" width={size} height={size} className="shrink-0 rounded-full border border-line object-cover" style={{ width: size, height: size }} />;
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center justify-center rounded-full border border-line bg-white text-navy" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size * 0.75} height={size * 0.75} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="20" cy="15" r="6" />
        <path d="M9 34 v-3 a11 11 0 0 1 22 0 v3" />
      </svg>
    </span>
  );
}

/** Operator serwisu (nadawca informacji marketingowych) – ta sama zmienna co w polityce prywatności. */
const OPERATOR = process.env.NEXT_PUBLIC_OPERATOR_NAME || "operatora serwisu InstrukcjePrawne.pl";

/**
 * Zgoda na marketing e-mailowy (art. 6 ust. 1 lit. a RODO, art. 398 Prawa komunikacji elektronicznej).
 * Dobrowolna: checkbox domyślnie odznaczony, niewymagany do rozmowy – dlatego bez dopisku „opcjonalnie”.
 */
const MARKETING_TEXT = `Zgadzam się na otrzymywanie od ${OPERATOR} na podany adres e-mail informacji marketingowych o nowych instrukcjach, poradnikach i materiałach edukacyjnych InstrukcjePrawne.pl. Zgodę mogę w każdej chwili wycofać – nie wpływa to na zgodność z prawem wysyłki dokonanej wcześniej.`;

/**
 * Kontakt z ekspertem odpowiedzialnym merytorycznie za dział – dwie zakładki:
 * „Chat z ekspertem” (dane kontaktowe → pytanie → rozmowa) i „Wyślij wiadomość e-mail” (formularz wysyłany przez stronę).
 * Nie ma automatycznych wiadomości – odpowiedzi pisze człowiek w panelu.
 */
export function ExpertChat({ topic, partnerName, disclosure, instructionSlug, instructionTitle, pathId, pathName, expert, openSignal, attachment = null, onAttachmentChange }: Props) {
  const storeKey = `ip:chat:${instructionSlug}`;
  const ids = useId();
  const [tab, setTab] = useState<Tab>("chat");

  // dane kontaktowe – wspólne dla obu zakładek
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [prefix, setPrefix] = useState("+48");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // czat
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [session, setSession] = useState<{ id: string; token: string } | null>(null);
  const [closed, setClosed] = useState(false);

  // e-mail
  const [subject, setSubject] = useState(`Pytanie: ${instructionTitle}`);
  const [mailBody, setMailBody] = useState("");
  const [mailState, setMailState] = useState<"form" | "sending" | "sent">("form");
  const [mailError, setMailError] = useState("");

  const startedAt = useRef(0);
  const lastId = useRef(0);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const expertLabel = expert && !expert.placeholder ? expert.name : "Ekspert";
  const expertWho = expert && !expert.placeholder ? expert.name : "ekspert odpowiedzialny za ten dział";
  const emailValid = EMAIL_RE.test(email.trim());

  const markStarted = useCallback(() => {
    if (!startedAt.current) startedAt.current = Date.now();
  }, []);

  // otwarcie z innego miejsca strony
  useEffect(() => {
    if (!openSignal) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reakcja na kliknięcie w innym miejscu strony
    setTab("chat");
    track("expert_cta_clicked", { instructionSlug, pathId, props: { source: "chat" } });
    setTimeout(() => (composerRef.current ?? firstFieldRef.current)?.focus({ preventScroll: true }), 400);
  }, [openSignal, instructionSlug, pathId]);

  // dołączony plan: podpowiedź treści, jeśli pole jest puste
  useEffect(() => {
    if (!attachment) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reakcja na dołączenie planu w innym miejscu strony
    setText((t) => t || `Dzień dobry, w załączeniu mój ${attachment.planTitle ?? attachment.title}. Chcę go omówić – od czego zacząć w mojej sytuacji?`);
    setMailBody((t) => t || `Dzień dobry, w załączeniu mój ${attachment.planTitle ?? attachment.title}. Chcę go omówić – od czego zacząć w mojej sytuacji?`);
  }, [attachment]);

  // przywrócenie rozmowy z tej przeglądarki
  useEffect(() => {
    const saved = store.get<{ id: string; token: string } | null>(storeKey, null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dane z localStorage dostępne po hydratacji
    if (saved?.id && saved.token) setSession(saved);
  }, [storeKey]);

  const fetchMessages = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/chat/${session.id}?po=${lastId.current}`, { headers: { "x-chat-token": session.token }, cache: "no-store" });
      if (res.status === 404) {
        store.set(storeKey, null);
        setSession(null);
        return;
      }
      const json = (await res.json()) as { status: string; messages: { id: number; author: Msg["author"]; author_name: string | null; body: string; attachment: Msg["attachment"] }[] };
      setClosed(json.status === "closed");
      if (json.messages.length) {
        lastId.current = json.messages[json.messages.length - 1].id;
        setMsgs((list) => [
          ...list.filter((m) => !m.id.startsWith("local-")),
          ...json.messages.map((m) => ({ id: `s-${m.id}`, author: m.author, body: m.body, authorName: m.author_name, attachment: m.attachment })),
        ]);
      }
    } catch {
      /* brak sieci – spróbujemy przy następnym odświeżeniu */
    }
  }, [session, storeKey]);

  useEffect(() => {
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pierwsze pobranie rozmowy
    void fetchMessages();
    const t = setInterval(fetchMessages, 15_000);
    return () => clearInterval(t);
  }, [session, fetchMessages]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs]);

  const validateContact = (phoneRequired: boolean) => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Podaj imię.";
    if (!emailValid) errs.email = "Podaj poprawny adres e-mail.";
    const d = digitsOf(phone);
    if (phoneRequired ? !/^\d{6,12}$/.test(d) : d && !/^\d{6,12}$/.test(d)) errs.phone = phoneRequired ? "Podaj poprawny numer telefonu (bez prefiksu)." : "Podaj poprawny numer telefonu albo zostaw pole puste.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goToQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContact(true)) return;
    track("expert_cta_clicked", { instructionSlug, pathId, props: { source: "chat" } });
    setReady(true);
    setTimeout(() => composerRef.current?.focus(), 0);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const body = text.trim();
    if (body.length < (session ? 1 : 5)) return setError("Napisz krótko, w czym możemy pomóc.");
    if (session) {
      setText("");
      setMsgs((l) => [...l, { id: `local-${Date.now()}`, author: "user", body, attachment }]);
      const res = await fetch(`/api/chat/${session.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: session.token, message: body, plan: attachment?.code }),
      });
      if (!res.ok) setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Nie udało się wysłać wiadomości.");
      else {
        onAttachmentChange?.(null);
        void fetchMessages();
      }
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          marketingConsent: marketing,
          phonePrefix: prefix,
          phone,
          message: body,
          topic,
          instructionSlug,
          pathId,
          website: (document.getElementById(`${ids}-www`) as HTMLInputElement | null)?.value || undefined,
          startedAt: startedAt.current || Date.now(),
          plan: attachment?.code,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; token?: string; error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok || !json.ok || !json.id || !json.token) {
        if (json.fieldErrors && ["name", "email", "phone"].some((k) => json.fieldErrors?.[k])) {
          setFieldErrors(json.fieldErrors);
          setReady(false);
        }
        setError(json.fieldErrors?.message ?? json.error ?? "Nie udało się rozpocząć rozmowy. Spróbuj ponownie.");
        return;
      }
      track("lead_submitted", { instructionSlug, pathId, props: { topic, source: "chat" } });
      const s = { id: json.id, token: json.token };
      store.set(storeKey, s);
      setText("");
      setMsgs([]);
      lastId.current = 0;
      onAttachmentChange?.(null);
      setSession(s);
    } catch {
      setError("Brak połączenia. Spróbuj ponownie.");
    } finally {
      setSending(false);
    }
  };

  const sendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMailError("");
    const okContact = validateContact(false);
    if (mailBody.trim().length < 5) {
      setFieldErrors((f) => ({ ...f, message: "Napisz krótko, w czym możemy pomóc." }));
      return;
    }
    if (!okContact) return;
    setMailState("sending");
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          marketingConsent: marketing,
          phonePrefix: prefix,
          phone: digitsOf(phone) || undefined,
          subject: subject.trim(),
          plan: attachment?.code,
          message: `${mailBody.trim()}${pathName ? `\n\n(Droga: ${pathName})` : ""}`,
          topic,
          instructionSlug,
          pathId,
          website: (document.getElementById(`${ids}-www2`) as HTMLInputElement | null)?.value || undefined,
          startedAt: startedAt.current || Date.now(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok || !json.ok) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        setMailError(json.error ?? "Nie udało się wysłać wiadomości. Spróbuj ponownie.");
        setMailState("form");
        return;
      }
      track("lead_submitted", { instructionSlug, pathId, props: { topic, source: "email" } });
      setMailState("sent");
      onAttachmentChange?.(null);
      setMailBody("");
    } catch {
      setMailError("Brak połączenia. Spróbuj ponownie.");
      setMailState("form");
    }
  };

  const endChat = () => {
    store.set(storeKey, null);
    setSession(null);
    setMsgs([]);
    setReady(false);
    setClosed(false);
    lastId.current = 0;
  };

  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const nextTab: Tab = tab === "chat" ? "email" : "chat";
    setTab(nextTab);
    document.getElementById(`${ids}-tab-${nextTab}`)?.focus();
  };

  const err = (k: string) =>
    fieldErrors[k] ? (
      <p id={`${ids}-${k}-err`} className="field-error">
        {fieldErrors[k]}
      </p>
    ) : null;

  const contactFields = (phoneRequired: boolean) => (
    <>
      <div>
        <label htmlFor={`${ids}-name`} className="field-label">Imię</label>
        <input id={`${ids}-name`} ref={firstFieldRef} value={name} onFocus={markStarted} onChange={(e) => setName(e.target.value)} autoComplete="given-name" className="field-input"
          aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? `${ids}-name-err` : undefined} />
        {err("name")}
      </div>
      <div>
        <label htmlFor={`${ids}-email`} className="field-label">E-mail</label>
        <input id={`${ids}-email`} type="email" inputMode="email" value={email} onFocus={markStarted} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="adres@email.pl" className="field-input"
          aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? `${ids}-email-err` : undefined} />
        {err("email")}
        {emailValid && (
          <label className="mt-2 flex items-start gap-2.5 text-xs">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-navy" />
            <span>
              {MARKETING_TEXT} <a href="/polityka-prywatnosci#marketing" className="underline">Więcej</a>
            </span>
          </label>
        )}
      </div>
      <div>
        <label htmlFor={`${ids}-phone`} className="field-label">
          Telefon{!phoneRequired && <span className="font-normal text-muted"> (opcjonalnie)</span>}
        </label>
        <div className="flex gap-2">
          <label htmlFor={`${ids}-prefix`} className="sr-only">Prefiks kraju</label>
          <select id={`${ids}-prefix`} value={prefix} onChange={(e) => setPrefix(e.target.value)} className="field-input w-24 shrink-0 px-2">
            {PREFIXES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input id={`${ids}-phone`} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel-national" placeholder="600 100 200" className="field-input min-w-0"
            aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={`${ids}-phone-note${fieldErrors.phone ? ` ${ids}-phone-err` : ""}`} />
        </div>
        {err("phone")}
        <p id={`${ids}-phone-note`} className="mt-1.5 text-xs text-muted">
          {phoneRequired
            ? "Jeśli odpowiedź przyjdzie, gdy nie będzie Cię już na stronie, wyślemy Ci SMS."
            : "Podaj, jeśli wolisz, żeby ekspert mógł też zadzwonić."}
        </p>
      </div>
    </>
  );

  const privacy = (
    <p className="text-xs text-muted">
      Wysyłając, prosisz o kontakt w tej sprawie. Twoje dane i wiadomość otrzyma {partnerName}. Szczegóły w{" "}
      <a href="/polityka-prywatnosci#formularz" className="underline">polityce prywatności</a>.
    </p>
  );

  const aboutContact = (
    <details className="mt-3 text-xs text-muted">
      <summary className="cursor-pointer select-none font-semibold underline-offset-2 hover:underline">Kto prowadzi rozmowę i co dzieje się z danymi</summary>
      <p className="mt-2">{disclosure}</p>
      <p className="mt-1">
        Wysyłając wiadomość, prosisz o kontakt w tej sprawie – Twoje dane i wiadomość otrzyma {partnerName}. Nie podawaj numerów dokumentów ani danych o
        zdrowiu. Szczegóły w <a href="/polityka-prywatnosci#formularz" className="underline">polityce prywatności</a>.
      </p>
    </details>
  );

  const waitingForExpert = session && msgs.length > 0 && !msgs.some((m) => m.author === "expert");

  return (
    <div className="mt-6">
      <div role="tablist" aria-label="Kontakt z ekspertem" className="flex gap-1 border-b border-line">
        {(
          [
            ["chat", "Chat z ekspertem", MessageCircle],
            ["email", "Wyślij wiadomość e-mail", Mail],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            id={`${ids}-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-controls={tab === key ? `${ids}-panel-${key}` : undefined}
            tabIndex={tab === key ? 0 : -1}
            onKeyDown={onTabKey}
            onClick={() => setTab(key)}
            className={`-mb-px flex min-h-12 items-center gap-2 border-b-[3px] px-3 text-sm font-bold sm:px-4 sm:text-base ${tab === key ? "border-navy text-navy" : "border-transparent text-muted hover:text-navy"}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div id={`${ids}-panel-${tab}`} role="tabpanel" aria-labelledby={`${ids}-tab-${tab}`} className="mt-4 overflow-hidden rounded-md border border-line bg-white">
        {/* ekspert odpowiedzialny za dział */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Avatar expert={expert} size={44} />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">
              {expertLabel}
              {expert?.placeholder && <span className="ml-1 rounded-sm bg-gold-soft px-1.5 py-0.5 text-[0.7rem] font-semibold">dane do uzupełnienia</span>}
            </p>
            <p className="text-sm text-muted">{expert && !expert.placeholder && expert.title ? `${expert.title} · ` : ""}odpowiada merytorycznie za ten dział</p>
          </div>
          {tab === "chat" && session && (
            <button type="button" onClick={endChat} className="shrink-0 text-xs font-semibold text-muted underline">
              Zakończ na tym urządzeniu
            </button>
          )}
        </div>

        {tab === "chat" ? (
          <div className="flex min-h-[26rem] flex-col bg-canvas">
            {!session && !ready && (
              <form onSubmit={goToQuestion} noValidate className="m-auto grid w-full max-w-sm gap-4 px-4 py-8">
                <p className="text-center font-extrabold">Żeby rozpocząć rozmowę, wpisz swoje dane</p>
                {attachment && (
                  <div className="grid gap-1.5">
                    <p className="text-center text-xs text-muted">Do pierwszej wiadomości dołączymy:</p>
                    <AttachmentCard title={attachment.title} href={attachment.href} summary={attachment.summary} onRemove={() => onAttachmentChange?.(null)} />
                  </div>
                )}
                {contactFields(true)}
                <button className="btn btn-primary">Przejdź do pytania</button>
              </form>
            )}

            {!session && ready && (
              <div className="m-auto max-w-sm px-4 py-8 text-center">
                <p className="font-extrabold">Napisz swoje pytanie</p>
                <p className="mt-1 text-sm text-muted">Odpowie {expertWho}. Odpowiedź pojawi się w tym oknie.</p>
                <p className="mt-4 text-xs text-muted">
                  {name.trim()} · {email.trim()} · {prefix} {digitsOf(phone)} ·{" "}
                  <button type="button" onClick={() => setReady(false)} className="font-semibold text-navy underline">
                    Zmień dane
                  </button>
                </p>
              </div>
            )}

            {session && (
              <div ref={logRef} role="log" aria-live="polite" aria-label="Wiadomości czatu" className="grid max-h-[26rem] flex-1 content-start gap-3 overflow-y-auto px-4 py-4">
                {msgs.map((m) =>
                  m.author === "user" ? (
                    <div key={m.id} className="ml-auto grid max-w-[85%] gap-2 rounded-md bg-navy px-3.5 py-2.5 text-sm whitespace-pre-line text-white">
                      {m.attachment && <AttachmentCard title={m.attachment.title} href={m.attachment.href} summary={m.attachment.summary} tone="dark" />}
                      <span>{m.body}</span>
                    </div>
                  ) : m.author === "expert" ? (
                    <div key={m.id} className="flex max-w-[90%] items-end gap-2">
                      <Avatar expert={expert} size={28} />
                      <div>
                        <p className="mb-0.5 text-[0.7rem] text-muted">{m.authorName ?? expertLabel}</p>
                        <div className="rounded-md border border-line bg-white px-3.5 py-2.5 text-sm whitespace-pre-line">{m.body}</div>
                      </div>
                    </div>
                  ) : null,
                )}
                {waitingForExpert && (
                  <p className="text-center text-xs text-muted">
                    Wiadomość trafiła do: {expertWho}. Odpowiedź pojawi się tutaj – a jeśli zamkniesz stronę, damy Ci znać SMS-em.
                  </p>
                )}
              </div>
            )}

            {(ready || session) && !closed && (
              <form onSubmit={send} noValidate className="mt-auto border-t border-line bg-white p-3">
                {attachment && (
                  <div className="mb-2">
                    <AttachmentCard title={attachment.title} href={attachment.href} summary={`Załącznik · ${attachment.summary}`} onRemove={() => onAttachmentChange?.(null)} />
                  </div>
                )}
                <label htmlFor={`${ids}-msg`} className="sr-only">Twoje pytanie</label>
                <div className="flex items-end gap-2 rounded-md border-2 border-line bg-white p-1.5 focus-within:border-navy">
                  <textarea
                    id={`${ids}-msg`}
                    ref={composerRef}
                    rows={1}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      // pole rośnie razem z tekstem (do ok. 6 linii), zamiast przesuwać układ
                      e.currentTarget.style.height = "auto";
                      e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 160)}px`;
                    }}
                    placeholder={session ? "Napisz wiadomość…" : "Opisz krótko swoją sprawę"}
                    className="block max-h-40 min-h-10 w-full flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 outline-none"
                    disabled={sending}
                    aria-invalid={Boolean(error)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }}
                  />
                  <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-navy text-white hover:bg-navy-soft disabled:opacity-55" disabled={sending} aria-label="Wyślij">
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {error && <p role="alert" className="field-error mt-2">{error}</p>}
              </form>
            )}
            {closed && <p className="mt-auto border-t border-line bg-white p-3 text-center text-sm text-muted">Rozmowa została zamknięta. Nową rozpoczniesz po kliknięciu „Zakończ na tym urządzeniu”.</p>}
            {/* pułapka na boty */}
            <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
              <input id={`${ids}-www`} tabIndex={-1} autoComplete="off" />
            </div>
          </div>
        ) : (
          <div className="min-h-[26rem] bg-canvas px-4 py-6">
            {mailState === "sent" ? (
              <div role="status" className="mx-auto max-w-sm py-12 text-center">
                <p className="text-lg font-extrabold">Wiadomość wysłana</p>
                <p className="mt-2 text-sm text-muted">Odpowiedź przyjdzie na adres {email.trim()}.</p>
                <button type="button" onClick={() => setMailState("form")} className="btn btn-secondary mt-6">Napisz kolejną wiadomość</button>
              </div>
            ) : (
              <form onSubmit={sendMail} noValidate className="mx-auto grid w-full max-w-lg gap-4">
                {attachment && <AttachmentCard title={attachment.title} href={attachment.href} summary={`Załącznik · ${attachment.summary}`} onRemove={() => onAttachmentChange?.(null)} />}
                {contactFields(false)}
                <div>
                  <label htmlFor={`${ids}-subject`} className="field-label">Temat</label>
                  <input id={`${ids}-subject`} value={subject} onChange={(e) => setSubject(e.target.value)} className="field-input" aria-invalid={Boolean(fieldErrors.subject)} />
                  {err("subject")}
                </div>
                <div>
                  <label htmlFor={`${ids}-body`} className="field-label">Wiadomość</label>
                  <textarea id={`${ids}-body`} rows={5} value={mailBody} onFocus={markStarted} onChange={(e) => setMailBody(e.target.value)} placeholder="Opisz krótko swoją sprawę" className="field-input resize-y"
                    aria-invalid={Boolean(fieldErrors.message)} aria-describedby={fieldErrors.message ? `${ids}-message-err` : undefined} />
                  {err("message")}
                </div>
                {privacy}
                <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                  <input id={`${ids}-www2`} tabIndex={-1} autoComplete="off" />
                </div>
                {mailError && <p role="alert" className="field-error">{mailError}</p>}
                <button className="btn btn-primary justify-self-start" disabled={mailState === "sending"}>
                  <Send className="h-4 w-4" aria-hidden="true" /> {mailState === "sending" ? "Wysyłanie…" : "Wyślij wiadomość"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
      {tab === "chat" && aboutContact}
    </div>
  );
}
