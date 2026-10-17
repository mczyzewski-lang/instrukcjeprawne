import Link from "next/link";
import { notFound } from "next/navigation";
import { chatStatusAction, replyChatAction } from "@/app/admin/actions";
import { getChat, listMessages, markSeen } from "@/lib/repo/chats";
import { getExpert } from "@/lib/repo/experts";

export const metadata = { title: "Rozmowa" };

export default async function ChatDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ info?: string; blad?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const c = getChat(id);
  if (!c) notFound();
  markSeen(id, "admin");
  const msgs = listMessages(id);
  const expert = c.expert_id ? getExpert(c.expert_id) : null;
  const defaultAs = expert && expert.status === "published" ? expert.name : "";
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-4">
        <Link href="/admin/czaty" className="text-sm">← Wszystkie rozmowy</Link>
        <h1 className="text-h2 font-extrabold">{c.channel === "email" ? "Wiadomość e-mail" : "Czat"}: {c.name}</h1>
        {c.subject && <p className="font-bold">Temat: {c.subject}</p>}
        {sp.info && <p role="status" className="text-sm font-bold">{sp.info}</p>}
        {sp.blad && <p role="alert" className="field-error">{sp.blad}</p>}
        <ol className="grid gap-3">
          {msgs.map((m) => (
            <li key={m.id} className={m.author === "system" ? "text-center text-xs text-muted" : `max-w-[85%] rounded-md p-3 text-sm whitespace-pre-line ${m.author === "user" ? "border border-line bg-white" : "ml-auto bg-navy text-white"}`}>
              {m.author !== "system" && <span className={`mb-1 block text-xs ${m.author === "user" ? "text-muted" : "text-white/70"}`}>{m.author_name ?? m.author} · {m.created_at.slice(0, 16).replace("T", " ")}</span>}
              {m.body}
              {m.attachment && (
                <a href={m.attachment.href} target="_blank" rel="noopener" className={`mt-2 block rounded-sm border px-3 py-2 text-xs font-bold no-underline ${m.author === "user" ? "border-line" : "border-white/40 text-white"}`}>
                  📄 {m.attachment.title} (PDF){m.attachment.summary ? ` · ${m.attachment.summary}` : ""}
                </a>
              )}
            </li>
          ))}
        </ol>
        {c.status === "open" ? (
          <form action={replyChatAction} className="card grid gap-3 p-4">
            <input type="hidden" name="id" value={c.id} />
            {c.channel === "email" && <p className="text-sm text-muted">Odpowiedź wyślemy e-mailem na adres {c.email}.</p>}
            <label><span className="field-label">Odpowiedź</span><textarea name="body" rows={5} required className="field-input" /></label>
            <label><span className="field-label">Podpis (kto odpowiada)</span><input name="as" defaultValue={defaultAs} placeholder="Imię i nazwisko eksperta" className="field-input" /></label>
            <button className="btn btn-primary justify-self-start">Wyślij odpowiedź</button>
          </form>
        ) : (
          <p className="text-sm text-muted">Rozmowa zamknięta.</p>
        )}
      </div>
      <aside className="card grid content-start gap-3 p-4 text-sm">
        <p className="font-extrabold">Dane kontaktowe</p>
        <p><strong>{c.name}</strong><br /><a href={`mailto:${c.email}`}>{c.email}</a><br /><a href={`tel:${c.phone}`}>{c.phone}</a></p>
        <p>Zgoda marketingowa: <strong>{c.marketing_consent ? "tak" : "nie"}</strong></p>
        <p>Partner: {c.partner}<br />Instrukcja: {c.instruction_slug}<br />Droga: {c.path_id ?? "—"}</p>
        <p>Ekspert działu: {expert?.name ?? "—"}</p>
        <p>Ostatnio na stronie: {c.user_seen_at?.slice(0, 16).replace("T", " ") ?? "—"}<br />SMS: {c.sms_status ?? "—"}<br />E-mail: {c.mail_status ?? "—"}</p>
        <form action={chatStatusAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="id" value={c.id} />
          <button name="op" value={c.status === "open" ? "close" : "open"} className="btn btn-secondary min-h-9 text-sm">{c.status === "open" ? "Zamknij rozmowę" : "Otwórz ponownie"}</button>
          <button name="op" value="delete" className="btn btn-ghost min-h-9 text-sm text-urgent">Usuń</button>
        </form>
      </aside>
    </div>
  );
}
