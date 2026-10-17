import Link from "next/link";
import { smsConfig } from "@/lib/config";
import { listChats } from "@/lib/repo/chats";

export const metadata = { title: "Czaty" };

export default function Chats() {
  const chats = listChats();
  const sms = smsConfig();
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-h2 font-extrabold">Czaty z ekspertami</h1>
        <p className="mt-1 text-sm text-muted">
          Odpowiedzi pisze ekspert (albo osoba w jego imieniu) – pojawiają się u użytkownika w oknie czatu na stronie instrukcji. Gdy użytkownika nie ma na stronie,
          wysyłamy SMS {sms.configured ? "przez skonfigurowaną bramkę." : "– ale bramka SMS nie jest skonfigurowana (SMS_WEBHOOK_URL), więc skontaktuj się telefonicznie lub e-mailem."}
        </p>
      </div>
      {chats.length === 0 ? (
        <p className="text-muted">Brak rozmów.</p>
      ) : (
        <ul className="grid gap-2">
          {chats.map((c) => {
            const waiting = c.last_author === "user" && c.status === "open";
            return (
              <li key={c.id}>
                <Link href={`/admin/czaty/${c.id}`} className={`card flex flex-wrap items-center justify-between gap-3 p-4 no-underline hover:border-navy ${waiting ? "border-2 border-gold" : ""}`}>
                  <span className="min-w-0">
                    <span className="font-extrabold">{c.name}</span> <span className="text-sm text-muted">· {c.partner} · {c.instruction_slug}</span>
                    <span className="mt-1 block truncate text-sm text-muted">{c.last_body}</span>
                  </span>
                  <span className="text-right text-xs text-muted">
                    {waiting && <span className="badge mb-1 border-gold text-navy">czeka na odpowiedź</span>}
                    {c.status === "closed" && <span className="badge mb-1">zamknięta</span>}
                    <span className="block">{c.updated_at.slice(0, 16).replace("T", " ")}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
