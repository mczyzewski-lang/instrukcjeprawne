import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDbForTests } from "@/lib/db";
import { expertReply, getChat, listMessages, sendEmailMessage, startChat, verifyChatToken } from "@/lib/repo/chats";
import { getDb } from "@/lib/db";
import { chatStartSchema, emailMessageSchema } from "@/lib/schemas";

const input = chatStartSchema.parse({
  name: "Ewa",
  email: "ewa@przyklad.pl",
  marketingConsent: true,
  phonePrefix: "+48",
  phone: "600 100 200",
  message: "Mam pytanie o rozwód.",
  topic: "rozwod",
  instructionSlug: "jak-rozwiesc-sie-bez-konfliktu",
  startedAt: Date.now() - 10_000,
});

beforeEach(() => {
  resetDbForTests();
  vi.unstubAllEnvs();
  vi.stubGlobal("fetch", async () => new Response("ok"));
});

describe("czat z ekspertem", () => {
  it("waliduje telefon i e-mail", () => {
    expect(chatStartSchema.safeParse({ ...input, email: "a@b" }).success).toBe(false);
    expect(chatStartSchema.safeParse({ ...input, phone: "12" }).success).toBe(false);
    expect(chatStartSchema.safeParse({ ...input, phonePrefix: "+99" }).success).toBe(false);
  });

  it("tworzy rozmowę z tokenem, zapisuje zgodę i telefon z prefiksem", async () => {
    const r = await startChat(input, { expertName: "Anna" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(verifyChatToken(r.id, r.token)).not.toBeNull();
    expect(verifyChatToken(r.id, "zly-token-zly-token-zly")).toBeNull();
    const c = getChat(r.id)!;
    expect(c.phone).toBe("+48600100200");
    expect(c.marketing_consent).toBe(1);
    expect(c.lead_id).toBeTruthy();
    expect(listMessages(r.id).map((m) => m.author)).toEqual(["user"]); // bez automatycznych wiadomości
    expect(c.channel).toBe("chat");
  });

  it("odpowiedź eksperta: SMS tylko gdy użytkownika nie ma na stronie i bramka jest skonfigurowana", async () => {
    const r = await startChat(input, {});
    if (!r.ok) throw new Error();
    expect((await expertReply(r.id, "Anna", "Odpowiedź")).notice).toContain("nie było potrzeby");
    getDb().prepare("UPDATE chats SET user_seen_at = ? WHERE id = ?").run(new Date(Date.now() - 3600_000).toISOString(), r.id);
    expect((await expertReply(r.id, "Anna", "Druga")).notice).toContain("nieskonfigurowane");
    vi.stubEnv("SMS_WEBHOOK_URL", "https://sms.example.test/send");
    const calls: string[] = [];
    const fake = (async (_u: string, init: RequestInit) => {
      calls.push(String(init.body));
      return new Response("ok");
    }) as unknown as typeof fetch;
    expect((await expertReply(r.id, "Anna", "Trzecia", fake)).notice).toContain("wysłano");
    expect(JSON.parse(calls[0]).to).toBe("+48600100200");
    expect(listMessages(r.id).filter((m) => m.author === "expert")).toHaveLength(3);
  });

  it("wiadomość e-mail: telefon opcjonalny, powiadomienie eksperta i odpowiedź e-mailem przez Resend", async () => {
    const msg = emailMessageSchema.parse({ ...input, phone: "", subject: "Pytanie o rozwód" });
    expect(msg.phone).toBeUndefined();
    expect(emailMessageSchema.safeParse({ ...input, subject: "" }).success).toBe(false);
    const r = await sendEmailMessage(msg, { expertEmail: "ekspert@przyklad.pl" });
    if (!r.ok) throw new Error();
    const c = getChat(r.id)!;
    expect(c.channel).toBe("email");
    expect(c.phone).toBe("");
    expect(c.mail_status).toContain("nieskonfigurowany");
    expect((await expertReply(r.id, "Anna", "Odpowiedź")).notice).toContain("odpowiedz ze swojej skrzynki");

    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("MAIL_FROM", "InstrukcjePrawne <kontakt@przyklad.pl>");
    const sent: { to: string[]; reply_to?: string; subject: string }[] = [];
    const fake = (async (_u: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return new Response("{}");
    }) as unknown as typeof fetch;
    expect((await expertReply(r.id, "Anna", "Druga odpowiedź", fake)).notice).toContain("wysłano do ewa@przyklad.pl");
    expect(sent[0].to).toEqual(["ewa@przyklad.pl"]);
    expect(sent[0].subject).toContain("Pytanie o rozwód");
  });
});
