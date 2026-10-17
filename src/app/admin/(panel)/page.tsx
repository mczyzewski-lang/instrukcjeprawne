import Link from "next/link";
import { ConfigRow } from "@/components/admin/StatusBadge";
import { isProduction, openAiConfig, showUnreviewed, siteUrl, smsConfig } from "@/lib/config";
import { analyticsSummary } from "@/lib/repo/events";
import { countQuestionsByStatus, listAdminInstructions } from "@/lib/repo/content";
import { leadConfigState, listLeadConfigs, listLeads } from "@/lib/repo/leads";

export const metadata = { title: "Pulpit" };

export default function Dashboard() {
  const ins = listAdminInstructions();
  const qs = countQuestionsByStatus();
  const leads = listLeads(1000);
  const a = analyticsSummary(30);
  const oa = openAiConfig();
  const cfgs = listLeadConfigs();
  const stat = (label: string, value: string | number, href?: string) => (
    <li className="card p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{href ? <Link href={href} className="no-underline">{value}</Link> : value}</p>
    </li>
  );
  return (
    <div className="grid gap-10">
      <div>
        <h1 className="text-h2 font-extrabold">Pulpit</h1>
        <p className="mt-1 text-muted">Treści robocze i zatwierdzone są rozdzielone. Publicznie widać tylko opublikowane{showUnreviewed() ? " oraz – z oznaczeniem i noindex – „do zatwierdzenia”" : ""}.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stat("Instrukcje opublikowane", `${ins.filter((i) => i.hasPublished).length} / ${ins.length}`, "/admin/instrukcje")}
        {stat("Do zatwierdzenia", ins.filter((i) => i.status === "review").length + (qs.review ?? 0), "/admin/instrukcje")}
        {stat("Pytania w kolejce (szkice)", qs.draft ?? 0, "/admin/pytania?status=draft")}
        {stat("Zgłoszenia (wszystkie)", leads.length, "/admin/leady")}
      </ul>
      <section className="card p-5">
        <h2 className="text-lg font-extrabold">Najważniejsza metryka (30 dni)</h2>
        <p className="mt-1 text-sm text-muted">Odsetek sesji z otwartą instrukcją, w których użytkownik wykonał konkretny krok (ukończył drzewo, wybrał drogę, odhaczył krok lub dokument, pobrał PDF, poprosił o kontakt).</p>
        <p className="mt-3 text-4xl font-extrabold tabular-nums">{a.actionRate === null ? "—" : `${Math.round(a.actionRate * 100)}%`}</p>
        <p className="text-sm text-muted">{a.instructionSessionsWithAction} z {a.instructionSessions} sesji · dane tylko od osób, które zgodziły się na analitykę</p>
        <Link href="/admin/analityka" className="mt-3 inline-block text-sm font-semibold">Szczegóły →</Link>
      </section>
      <section className="card p-5">
        <h2 className="text-lg font-extrabold">Konfiguracja</h2>
        <ul className="mt-3">
          <ConfigRow label="Adres serwisu (NEXT_PUBLIC_SITE_URL)" ok={Boolean(process.env.NEXT_PUBLIC_SITE_URL)} detail={siteUrl()} />
          <ConfigRow label="Hasło administratora (ADMIN_PASSWORD)" ok={Boolean(process.env.ADMIN_PASSWORD)} detail={isProduction() ? "Wymagane w produkcji" : "Lokalnie działa hasło deweloperskie"} />
          <ConfigRow label="Sekret sesji (ADMIN_SESSION_SECRET)" ok={(process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32} detail="Min. 32 znaki" />
          <ConfigRow label="OpenAI – generator ilustracji (OPENAI_API_KEY)" ok={oa.configured} detail={oa.configured ? `Model: ${oa.model}` : "Bez klucza strona używa biblioteki SVG"} />
          <ConfigRow label="Bramka SMS dla czatu (SMS_WEBHOOK_URL)" ok={smsConfig().configured} detail="POST JSON { to, message } – powiadomienie, gdy ekspert odpowie" />
          <ConfigRow label="Podpis webhooków (LEAD_WEBHOOK_SECRET)" ok={Boolean(process.env.LEAD_WEBHOOK_SECRET)} detail="Nagłówek x-ip-signature (HMAC SHA-256)" />
          {cfgs.map((c) => {
            const st = leadConfigState(c);
            return <ConfigRow key={c.topic} label={`Webhook: ${c.partnerName} – ${c.partnerArea}`} ok={st.webhookConfigured} detail={st.webhookEnv} />;
          })}
          <ConfigRow label="Treści „do zatwierdzenia” widoczne publicznie" ok={!showUnreviewed()} detail={showUnreviewed() ? "PUBLIC_SHOW_UNREVIEWED=true – ustaw false przed startem produkcyjnym" : "Publicznie tylko treści zatwierdzone"} />
        </ul>
      </section>
    </div>
  );
}
