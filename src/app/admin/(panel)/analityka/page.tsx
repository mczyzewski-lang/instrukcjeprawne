import { analyticsSummary, EVENT_NAMES } from "@/lib/repo/events";

export const metadata = { title: "Analityka" };

export default async function Analytics({ searchParams }: { searchParams: Promise<{ dni?: string }> }) {
  const days = Math.min(365, Math.max(1, Number((await searchParams).dni) || 30));
  const a = analyticsSummary(days);
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-h2 font-extrabold">Analityka – ostatnie {days} dni</h1>
        <p className="mt-1 text-sm text-muted">Dane anonimowe, tylko od osób, które wyraziły zgodę. Bez IP i danych osobowych.</p>
        <p className="mt-2 flex gap-3 text-sm">{[7, 30, 90].map((d) => <a key={d} href={`?dni=${d}`}>{d} dni</a>)}</p>
      </div>
      <section className="card p-5">
        <h2 className="font-extrabold">Najważniejsza metryka</h2>
        <p className="mt-2 text-4xl font-extrabold">{a.actionRate === null ? "—" : `${Math.round(a.actionRate * 100)}%`}</p>
        <p className="text-sm text-muted">sesji z instrukcją zakończonych konkretnym krokiem ({a.instructionSessionsWithAction}/{a.instructionSessions})</p>
      </section>
      <section>
        <h2 className="font-extrabold">Zdarzenia</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {EVENT_NAMES.map((n) => <li key={n} className="card p-3"><p className="font-mono text-xs text-muted">{n}</p><p className="text-2xl font-extrabold tabular-nums">{a.totals[n] ?? 0}</p></li>)}
        </ul>
      </section>
      <section>
        <h2 className="font-extrabold">Według instrukcji</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="py-2">Instrukcja</th><th>Otwarcia</th><th>Ukończone drzewa</th><th>PDF</th><th>CTA</th><th>Zgłoszenia</th><th>Konwersja</th></tr></thead>
          <tbody>
            {a.byInstruction.map((r) => (
              <tr key={r.slug} className="border-b border-line"><td className="py-2">{r.slug}</td><td>{r.opened}</td><td>{r.completedTrees}</td><td>{r.pdf}</td><td>{r.cta}</td><td>{r.leads}</td><td>{r.opened ? `${((r.leads / r.opened) * 100).toFixed(1)}%` : "—"}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="font-extrabold">Według ścieżek</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="py-2">Instrukcja</th><th>Droga</th><th>Wybrana</th><th>Zgłoszenia</th></tr></thead>
          <tbody>{a.byPath.map((r) => <tr key={`${r.slug}-${r.path}`} className="border-b border-line"><td className="py-2">{r.slug}</td><td>{r.path}</td><td>{r.selected}</td><td>{r.leads}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
