import { saveLeadConfigAction } from "@/app/admin/actions";
import { leadConfigState, listLeadConfigs } from "@/lib/repo/leads";

export const metadata = { title: "Partnerzy" };

export default function Partners() {
  const cfgs = listLeadConfigs();
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-h2 font-extrabold">Partnerzy i kierowanie zgłoszeń</h1>
        <p className="mt-1 text-sm text-muted">Adresy webhooków ustawiasz wyłącznie w zmiennych środowiskowych – tutaj wskazujesz tylko nazwę zmiennej (LEAD_WEBHOOK_…). Zgłoszenia są wysyłane jako JSON POST z podpisem HMAC w nagłówku x-ip-signature (gdy ustawiono LEAD_WEBHOOK_SECRET).</p>
      </div>
      {cfgs.map((c) => {
        const st = leadConfigState(c);
        return (
          <form key={c.topic} action={saveLeadConfigAction} className="card grid gap-3 p-5 sm:grid-cols-2">
            <input type="hidden" name="topic" value={c.topic} />
            <p className="font-extrabold sm:col-span-2">Temat: {c.topic} <span className={`badge ml-2 ${st.webhookConfigured ? "border-navy text-navy" : "border-urgent text-urgent"}`}>{st.webhookConfigured ? "webhook aktywny" : "webhook nieskonfigurowany"}</span></p>
            <label><span className="field-label">Nazwa partnera</span><input name="partnerName" defaultValue={c.partnerName} className="field-input" /></label>
            <label><span className="field-label">Zmienna webhooka</span><input name="webhookEnv" defaultValue={c.webhookEnv} pattern="LEAD_WEBHOOK_[A-Z0-9_]+" className="field-input font-mono" /></label>
            <label className="sm:col-span-2"><span className="field-label">Widoczna informacja o współpracy</span><textarea name="visibleDisclosure" rows={3} defaultValue={c.visibleDisclosure} className="field-input" /></label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="askEmail" defaultChecked={c.formConfiguration.askEmail} className="h-5 w-5" /> Pytaj o e-mail (opcjonalny)</label>
            <button className="btn btn-secondary justify-self-start">Zapisz</button>
          </form>
        );
      })}
    </div>
  );
}
