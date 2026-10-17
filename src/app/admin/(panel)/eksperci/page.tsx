import { saveExpertAction, uploadExpertPhotoAction } from "@/app/admin/actions";
import { ExpertAvatar } from "@/components/instruction/Expert";
import { CATEGORIES } from "@/content/categories";
import { listExperts } from "@/lib/repo/experts";

export const metadata = { title: "Eksperci" };

export default async function Experts({ searchParams }: { searchParams: Promise<{ info?: string; blad?: string }> }) {
  const sp = await searchParams;
  const experts = listExperts();
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-h2 font-extrabold">Eksperci nadzorujący działy</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Ekspert pojawia się w instrukcjach swojego działu: krótko przy sekcjach A i E oraz w karcie „Kto odpowiada za tę instrukcję” nad źródłami – bez
          przycisków kontaktu. Dopóki status to „szkic”, dane widać tylko w trybie treści roboczych z oznaczeniem „do uzupełnienia”. Wpisuj wyłącznie prawdziwe
          dane osób, które zgodziły się na publikację wizerunku. Jeśli ekspert współpracuje z partnerem komercyjnym – wpisz to w polu „Powiązania”.
        </p>
        {sp.info && <p role="status" className="mt-3 text-sm font-bold">Zapisano.</p>}
        {sp.blad && <p role="alert" className="field-error mt-3">{sp.blad}</p>}
      </div>
      {experts.map((e) => (
        <div key={e.id} id={e.id} className="card grid gap-5 p-5 lg:grid-cols-[160px_1fr]">
          <div className="grid content-start gap-3">
            <ExpertAvatar expert={e} size={120} />
            <form action={uploadExpertPhotoAction} className="grid gap-2">
              <input type="hidden" name="id" value={e.id} />
              <input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="text-xs" aria-label={`Zdjęcie: ${e.name}`} />
              <button className="btn btn-ghost min-h-9 text-sm">Wgraj zdjęcie</button>
            </form>
          </div>
          <form action={saveExpertAction} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={e.id} />
            <label><span className="field-label">Imię i nazwisko</span><input name="name" defaultValue={e.name} className="field-input" /></label>
            <label><span className="field-label">Tytuł zawodowy</span><input name="title" defaultValue={e.title} placeholder="np. radca prawny" className="field-input" /></label>
            <label className="sm:col-span-2"><span className="field-label">Rola w serwisie</span><input name="role" defaultValue={e.role} className="field-input" /></label>
            <label className="sm:col-span-2"><span className="field-label">Krótki opis (2–3 zdania, bez języka reklamowego)</span><textarea name="bio" rows={3} defaultValue={e.bio} className="field-input" /></label>
            <label className="sm:col-span-2"><span className="field-label">Powiązania (ujawnienie)</span><input name="affiliation" defaultValue={e.affiliation} placeholder="np. Współpracuje z Pravna (podmiot komercyjny)" className="field-input" /></label>
            <fieldset className="sm:col-span-2">
              <legend className="field-label">Działy</legend>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((c) => (
                  <label key={c.slug} className="flex items-center gap-2 text-sm"><input type="checkbox" name="categories" value={c.slug} defaultChecked={e.categories.includes(c.slug)} className="h-4 w-4" /> {c.name}</label>
                ))}
              </div>
            </fieldset>
            <label><span className="field-label">Status</span>
              <select name="status" defaultValue={e.status} className="field-input"><option value="draft">Szkic (do uzupełnienia)</option><option value="published">Opublikowany</option></select>
            </label>
            <div className="flex items-end"><button className="btn btn-primary">Zapisz</button></div>
          </form>
        </div>
      ))}
    </div>
  );
}
