import { saveFoundersVideoAction } from "@/app/admin/actions";
import { getSetting } from "@/lib/repo/experts";
import type { FoundersVideo } from "@/lib/types";

export const metadata = { title: "Ustawienia" };

export default async function Settings({ searchParams }: { searchParams: Promise<{ info?: string; blad?: string }> }) {
  const sp = await searchParams;
  const v = getSetting<FoundersVideo>("founders_video");
  return (
    <div className="grid max-w-3xl gap-6">
      <h1 className="text-h2 font-extrabold">Ustawienia</h1>
      {sp.info && <p role="status" className="text-sm font-bold">Zapisano.</p>}
      {sp.blad && <p role="alert" className="field-error">{sp.blad}</p>}
      <form action={saveFoundersVideoAction} className="card grid gap-4 p-5">
        <p className="font-extrabold">Film od założycieli (strona „Jak to działa?”, format 1:1)</p>
        <p className="text-sm text-muted">Plik MP4/WebM (np. z własnego hostingu) odtworzy się na stronie. Link do Instagrama, TikToka lub YouTube otworzy film w nowej karcie. Puste pole = miejsce na film z informacją „w przygotowaniu”.</p>
        <label><span className="field-label">Adres filmu</span><input name="url" defaultValue={v?.url} placeholder="https://…/film.mp4" className="field-input" /></label>
        <label><span className="field-label">Tytuł / podpis</span><input name="title" defaultValue={v?.title} className="field-input" /></label>
        <label><span className="field-label">Obraz podglądu (URL, opcjonalnie)</span><input name="poster" defaultValue={v?.poster} className="field-input" /></label>
        <label><span className="field-label">Transkrypcja (dostępność)</span><textarea name="transcript" rows={6} defaultValue={v?.transcript} className="field-input" /></label>
        <button className="btn btn-primary justify-self-start">Zapisz</button>
      </form>
    </div>
  );
}
