import { deleteLeadAction, retryLeadAction } from "@/app/admin/actions";
import { listLeads } from "@/lib/repo/leads";

export const metadata = { title: "Zgłoszenia" };

const STATUS: Record<string, string> = { forwarded: "Przekazane", failed: "Błąd przekazania", not_configured: "Zapisane (webhook nieskonfigurowany)" };

export default function Leads() {
  const leads = listLeads();
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h2 font-extrabold">Zgłoszenia do ekspertów</h1>
          <p className="mt-1 text-sm text-muted">Dane osobowe – dostęp tylko dla uprawnionych. Usuwaj zgłoszenia po obsłudze (maks. 12 miesięcy).</p>
        </div>
        <a href="/admin/leady/eksport" className="btn btn-secondary">Eksport CSV</a>
      </div>
      {leads.length === 0 ? (
        <p className="text-muted">Brak zgłoszeń.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line text-muted"><tr><th className="py-2">Data</th><th>Kontakt</th><th>Temat / partner</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-line align-top">
                  <td className="py-3 pr-3 text-muted">{l.created_at.slice(0, 16).replace("T", " ")}</td>
                  <td className="pr-3"><strong>{l.name}</strong><br />{l.phone}{l.email && <><br />{l.email}</>}</td>
                  <td className="pr-3">{l.partner}<br /><span className="text-xs text-muted">{l.context}</span></td>
                  <td className="pr-3">{STATUS[l.status] ?? l.status}{l.last_error && <span className="block text-xs text-urgent">{l.last_error}</span>}<span className="block text-xs text-muted">próby: {l.forward_attempts}</span></td>
                  <td className="whitespace-nowrap text-right">
                    <form action={retryLeadAction.bind(null, l.id)} className="inline"><button className="btn btn-ghost min-h-9 text-sm">Przekaż ponownie</button></form>
                    <form action={deleteLeadAction.bind(null, l.id)} className="inline"><button className="btn btn-ghost min-h-9 text-sm text-urgent">Usuń</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
