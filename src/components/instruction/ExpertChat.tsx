"use client";

import { Mail, MessageCircle, Send } from "lucide-react";
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
}

type Stage = "idle" | "name" | "email" | "phone" | "message" | "sending" | "active";

interface Msg {
  id: string;
  author: "bot" | "user" | "expert" | "system";
  body: string;
  authorName?: string | null;
}

const PREFIXES = ["+48", "+49", "+44", "+353", "+31", "+47", "+46", "+420", "+380", "+1"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

/**
 * Czat z ekspertem odpowiedzialnym merytorycznie za dział.
 * Najpierw zbiera kolejno: imię, e-mail (+ opcjonalna zgoda marketingowa), telefon z prefiksem, wiadomość.
 * Odpowiedzi pisze człowiek w panelu – czat ich nie generuje.
 */
export function ExpertChat({ topic, partnerName, disclosure, instructionSlug, instructionTitle, pathId, pathName, expert, openSignal }: Props) {
  const storeKey = `ip:chat:${instructionSlug}`;
  const [stage, setStage] = useState<Stage>("idle");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [prefix, setPrefix] = useState("+48");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [session, setSession] = useState<{ id: string; token: string } | null>(null);
  const [closed, setClosed] = useState(false);
  const startedAt = useRef(0);
  const lastId = useRef(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const ids = useId();
  const expertLabel = expert && !expert.placeholder ? expert.name : "Ekspert";

  const push = (m: Omit<Msg, "id">) => setMsgs((list) => [...list, { ...m, id: `${Date.now()}-${list.length}` }]);

  const start = useCallback(() => {
    if (stage !== "idle") return;
    startedAt.current = Date.now();
    track("expert_cta_clicked", { instructionSlug, pathId, props: { source: "chat" } });
    setMsgs([
      { id: "b1", author: "bot", body: `Dzień dobry! Napisz, w czym możemy pomóc – odpowie ${expert && !expert.placeholder ? expert.name : "ekspert odpowiedzialny za ten dział"}. Najpierw kilka danych do kontaktu.` },
      { id: "b2", author: "bot", body: "Jak masz na imię?" },
    ]);
    setStage("name");
  }, [stage, instructionSlug, pathId, expert]);

  // otwarcie z innego miejsca strony
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reakcja na kliknięcie w innym miejscu strony
    if (openSignal) start();
  }, [openSignal, start]);

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
      const json = (await res.json()) as { status: string; messages: { id: number; author: Msg["author"]; author_name: string | null; body: string }[] };
      setClosed(json.status === "closed");
      if (json.messages.length) {
        lastId.current = json.messages[json.messages.length - 1].id;
        setMsgs((list) => [
          ...list.filter((m) => !m.id.startsWith("local-")),
          ...json.messages.map((m) => ({ id: `s-${m.id}`, author: m.author, body: m.body, authorName: m.author_name })),
        ]);
      }
      setStage("active");
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
    if (stage !== "idle" && stage !== "sending") inputRef.current?.focus({ preventScroll: true });
  }, [msgs, stage]);

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (stage === "name") {
      if (name.trim().length < 2) return setError("Podaj imię.");
      push({ author: "user", body: name.trim() });
      push({ author: "bot", body: `Dziękuję, ${name.trim()}. Podaj adres e-mail – wyślemy na niego odpowiedź.` });
      setStage("email");
    } else if (stage === "email") {
      if (!EMAIL_RE.test(email.trim())) return setError("Podaj poprawny adres e-mail.");
      push({ author: "user", body: email.trim() });
      push({ author: "bot", body: "Podaj numer telefonu. Jeśli odpowiedź przyjdzie, gdy nie będzie Cię na stronie, wyślemy Ci SMS." });
      setStage("phone");
    } else if (stage === "phone") {
      const digits = phone.replace(/[\s()-]/g, "");
      if (!/^\d{6,12}$/.test(digits)) return setError("Podaj poprawny numer telefonu (bez prefiksu).");
      push({ author: "user", body: `${prefix} ${digits}` });
      push({ author: "bot", body: "Opisz krótko swoją sprawę. Nie podawaj numerów dokumentów ani danych o zdrowiu – szczegóły omówisz z ekspertem." });
      setStage("message");
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const body = text.trim();
    if (body.length < (session ? 1 : 5)) return setError("Napisz krótko, w czym możemy pomóc.");
    if (session) {
      setText("");
      push({ author: "user", body });
      setMsgs((l) => l.map((m, i) => (i === l.length - 1 ? { ...m, id: `local-${m.id}` } : m)));
      const res = await fetch(`/api/chat/${session.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: session.token, message: body }) });
      if (!res.ok) setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Nie udało się wysłać wiadomości.");
      else void fetchMessages();
      return;
    }
    setStage("sending");
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
          startedAt: startedAt.current,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; token?: string; error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok || !json.ok || !json.id || !json.token) {
        setError(Object.values(json.fieldErrors ?? {})[0] ?? json.error ?? "Nie udało się rozpocząć rozmowy. Spróbuj ponownie.");
        setStage("message");
        return;
      }
      track("lead_submitted", { instructionSlug, pathId, props: { topic, source: "chat" } });
      const s = { id: json.id, token: json.token };
      store.set(storeKey, s);
      setText("");
      setMsgs([]);
      lastId.current = 0;
      setSession(s);
    } catch {
      setError("Brak połączenia. Spróbuj ponownie.");
      setStage("message");
    }
  };

  const endChat = () => {
    store.set(storeKey, null);
    setSession(null);
    setMsgs([]);
    setStage("idle");
    lastId.current = 0;
  };

  const mailto = expert?.email
    ? `mailto:${expert.email}?subject=${encodeURIComponent(`Pytanie: ${instructionTitle}`)}&body=${encodeURIComponent(`Dzień dobry,\n\n(opisz krótko swoją sprawę)\n\nInstrukcja: ${instructionTitle}${pathName ? `\nDroga: ${pathName}` : ""}`)}`
    : null;

  const emailValid = EMAIL_RE.test(email.trim());

  return (
    <div>
      {/* ekspert odpowiedzialny za dział */}
      <div className="mt-6 flex items-center gap-4 border-t border-line pt-5">
        <Avatar expert={expert} size={56} />
        <div>
          <p className="font-extrabold">
            {expertLabel}
            {expert?.placeholder && <span className="ml-1 rounded-sm bg-gold-soft px-1.5 py-0.5 text-[0.7rem] font-semibold">dane do uzupełnienia</span>}
          </p>
          <p className="text-sm text-muted">{expert && !expert.placeholder && expert.title ? `${expert.title} · ` : ""}odpowiada merytorycznie za ten dział</p>
        </div>
      </div>

      {stage === "idle" && !session && (
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={start}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Rozpocznij chat
          </button>
          {mailto && (
            <a href={mailto} className="btn btn-secondary" onClick={() => track("expert_cta_clicked", { instructionSlug, pathId, props: { source: "email" } })}>
              <Mail className="h-4 w-4" aria-hidden="true" /> Wyślij wiadomość e-mail
            </a>
          )}
        </div>
      )}

      {(stage !== "idle" || session) && (
        <div className="mt-5 overflow-hidden rounded-md border border-line bg-canvas">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2.5">
            <p className="text-sm font-bold">Chat z ekspertem</p>
            {session && (
              <button type="button" onClick={endChat} className="text-xs font-semibold text-muted underline">
                Zakończ na tym urządzeniu
              </button>
            )}
          </div>
          <p className="border-b border-line bg-white px-4 py-2 text-xs text-muted">{disclosure}</p>
          <div ref={logRef} role="log" aria-live="polite" aria-label="Wiadomości czatu" className="grid max-h-96 gap-3 overflow-y-auto px-4 py-4">
            {msgs.map((m) =>
              m.author === "user" ? (
                <div key={m.id} className="ml-auto max-w-[85%] rounded-md bg-navy px-3.5 py-2.5 text-sm whitespace-pre-line text-white">
                  {m.body}
                </div>
              ) : m.author === "system" ? (
                <p key={m.id} className="text-center text-xs text-muted">
                  {m.body}
                </p>
              ) : (
                <div key={m.id} className="flex max-w-[90%] items-end gap-2">
                  <Avatar expert={expert} size={28} />
                  <div>
                    <p className="mb-0.5 text-[0.7rem] text-muted">{m.author === "expert" ? (m.authorName ?? expertLabel) : "Wiadomość automatyczna"}</p>
                    <div className="rounded-md border border-line bg-white px-3.5 py-2.5 text-sm whitespace-pre-line">{m.body}</div>
                  </div>
                </div>
              ),
            )}
            {stage === "sending" && <p className="text-center text-xs text-muted">Wysyłanie…</p>}
          </div>

          {/* pole odpowiedzi – zależne od etapu */}
          <div className="border-t border-line bg-white p-3">
            {(stage === "name" || stage === "email" || stage === "phone") && (
              <form onSubmit={next} className="grid gap-2" noValidate>
                {stage === "name" && (
                  <>
                    <label htmlFor={`${ids}-name`} className="sr-only">Imię</label>
                    <div className="flex gap-2">
                      <input id={`${ids}-name`} ref={(el) => { inputRef.current = el; }} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" placeholder="Imię" className="field-input" aria-invalid={Boolean(error)} />
                      <button className="btn btn-primary shrink-0 px-4" aria-label="Dalej"><Send className="h-4 w-4" aria-hidden="true" /></button>
                    </div>
                  </>
                )}
                {stage === "email" && (
                  <>
                    <label htmlFor={`${ids}-email`} className="sr-only">E-mail</label>
                    <div className="flex gap-2">
                      <input id={`${ids}-email`} ref={(el) => { inputRef.current = el; }} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="adres@email.pl" className="field-input" aria-invalid={Boolean(error)} />
                      <button className="btn btn-primary shrink-0 px-4" aria-label="Dalej"><Send className="h-4 w-4" aria-hidden="true" /></button>
                    </div>
                    {emailValid && (
                      <label className="flex items-start gap-2.5 px-1 text-xs">
                        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-navy" />
                        <span>(Opcjonalnie) Zgadzam się na otrzymywanie e-mailem informacji o nowych instrukcjach i materiałach edukacyjnych InstrukcjePrawne.pl. Zgodę mogę w każdej chwili wycofać.</span>
                      </label>
                    )}
                  </>
                )}
                {stage === "phone" && (
                  <>
                    <div className="flex gap-2">
                      <label htmlFor={`${ids}-prefix`} className="sr-only">Prefiks kraju</label>
                      <select id={`${ids}-prefix`} value={prefix} onChange={(e) => setPrefix(e.target.value)} className="field-input w-24 shrink-0 px-2">
                        {PREFIXES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <label htmlFor={`${ids}-phone`} className="sr-only">Numer telefonu</label>
                      <input id={`${ids}-phone`} ref={(el) => { inputRef.current = el; }} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel-national" placeholder="600 100 200" className="field-input min-w-0" aria-invalid={Boolean(error)} />
                      <button className="btn btn-primary shrink-0 px-4" aria-label="Dalej"><Send className="h-4 w-4" aria-hidden="true" /></button>
                    </div>
                    <p className="px-1 text-xs text-muted">Jeśli przez dłuższy czas nie będzie odpowiedzi na stronie, wyślemy Ci SMS, gdy ekspert odpisze.</p>
                  </>
                )}
              </form>
            )}
            {(stage === "message" || stage === "sending" || stage === "active") && !closed && (
              <form onSubmit={send} className="grid gap-2" noValidate>
                <label htmlFor={`${ids}-msg`} className="sr-only">Wiadomość</label>
                <div className="flex items-end gap-2">
                  <textarea id={`${ids}-msg`} ref={(el) => { inputRef.current = el; }} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={session ? "Napisz wiadomość…" : "Opisz krótko swoją sprawę"} className="field-input resize-y" disabled={stage === "sending"} aria-invalid={Boolean(error)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} />
                  <button className="btn btn-primary shrink-0 px-4" disabled={stage === "sending"} aria-label="Wyślij"><Send className="h-4 w-4" aria-hidden="true" /></button>
                </div>
                {!session && (
                  <p className="px-1 text-xs text-muted">
                    Wysyłając, prosisz o kontakt w tej sprawie. Twoje dane i wiadomość otrzyma {partnerName}. Szczegóły w{" "}
                    <a href="/polityka-prywatnosci#formularz" className="underline">polityce prywatności</a>.
                  </p>
                )}
              </form>
            )}
            {closed && <p className="text-center text-sm text-muted">Rozmowa została zamknięta. Możesz rozpocząć nową po kliknięciu „Zakończ na tym urządzeniu”.</p>}
            {/* pułapka na boty */}
            <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
              <input id={`${ids}-www`} tabIndex={-1} autoComplete="off" />
            </div>
            {error && <p role="alert" className="field-error px-1">{error}</p>}
          </div>
        </div>
      )}

      {(stage !== "idle" || session) && mailto && (
        <p className="mt-3 text-sm">
          Wolisz e-mail? <a href={mailto}>Wyślij wiadomość e-mail</a>
        </p>
      )}
    </div>
  );
}
