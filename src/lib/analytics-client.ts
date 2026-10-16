/**
 * Klient analityki: wysyła zdarzenia wyłącznie po wyrażeniu zgody.
 * Bez ciasteczek – losowy identyfikator sesji w sessionStorage (znika po zamknięciu karty).
 */

export type ClientEventName =
  | "search_performed"
  | "instruction_opened"
  | "decision_tree_started"
  | "decision_answer_selected"
  | "decision_tree_completed"
  | "path_selected"
  | "instruction_step_completed"
  | "pdf_downloaded"
  | "expert_cta_clicked"
  | "lead_submitted";

export const CONSENT_KEY = "ip_consent_v1";
export type ConsentValue = "granted" | "denied";

export function getConsent(): ConsentValue | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: ConsentValue) {
  try {
    localStorage.setItem(CONSENT_KEY, v);
    if (v === "denied") sessionStorage.removeItem("ip_sid");
  } catch {
    /* brak dostępu do storage – zgoda obowiązuje do odświeżenia */
  }
  window.dispatchEvent(new CustomEvent("ip-consent", { detail: v }));
}

function sessionId(): string | undefined {
  try {
    let sid = sessionStorage.getItem("ip_sid");
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("ip_sid", sid);
    }
    return sid;
  } catch {
    return undefined;
  }
}

export function track(name: ClientEventName, data: { instructionSlug?: string; pathId?: string; props?: Record<string, string | number | boolean> } = {}) {
  if (typeof window === "undefined" || getConsent() !== "granted") return;
  const body = JSON.stringify({ name, sessionId: sessionId(), ...data });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else void fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  } catch {
    /* analityka nie może blokować działania strony */
  }
}

/** Bezpieczny dostęp do localStorage (postęp, checklisty). */
export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignorujemy – np. tryb prywatny */
    }
  },
};
