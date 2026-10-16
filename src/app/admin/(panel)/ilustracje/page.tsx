import Link from "next/link";
import { generateIllustrationAction, illustrationStatusAction, uploadIllustrationAction } from "@/app/admin/actions";
import { Illustration } from "@/components/ui/Illustration";
import { getIllustration } from "@/illustrations/library";
import { openAiConfig } from "@/lib/config";
import { buildPrompt, listIllustrations, PROMPT_VERSION, stepTargetKey } from "@/lib/illustration-generator";
import { getInstructionForEdit, listAdminInstructions } from "@/lib/repo/content";

export const metadata = { title: "Ilustracje" };

const STATUS: Record<string, string> = { pending: "Czeka na zatwierdzenie", approved: "Zatwierdzona", manual: "Wgrana ręcznie", rejected: "Odrzucona", replaced: "Zastąpiona", failed: "Błąd generowania" };

export default async function Illustrations({ searchParams }: { searchParams: Promise<{ i?: string; info?: string; blad?: string }> }) {
  const sp = await searchParams;
  const list = listAdminInstructions();
  const current = getInstructionForEdit(sp.i ?? list[0]?.id ?? "");
  const oa = openAiConfig();
  const back = `/admin/ilustracje?i=${current?.draft.id ?? ""}`;
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-h2 font-extrabold">Ilustracje</h1>
        <p className="mt-1 text-sm text-muted">
          {oa.configured ? `Generator OpenAI aktywny (model ${oa.model}, prompt ${PROMPT_VERSION}).` : "OPENAI_API_KEY nie jest ustawiony – generowanie wyłączone. Strona używa biblioteki SVG; możesz wgrywać grafiki ręcznie."}{" "}
          Wygenerowane grafiki nie są publikowane bez zatwierdzenia. Strona nigdy nie generuje grafik przy wyświetlaniu.
        </p>
        {sp.info && <p role="status" className="mt-3 text-sm font-bold">{sp.info === "cache" ? "Użyto istniejącej grafiki z cache (ten sam prompt)." : sp.info === "upload" ? "Wgrano grafikę." : "Wygenerowano – czeka na zatwierdzenie."}</p>}
        {sp.blad && <p role="alert" className="field-error mt-3">{sp.blad}</p>}
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        {list.map((i) => <Link key={i.id} href={`/admin/ilustracje?i=${i.id}`} className={`badge min-h-9 px-3 ${i.id === current?.draft.id ? "border-navy text-navy" : ""}`}>{i.title}</Link>)}
      </nav>
      {current?.draft.paths.map((p) => (
        <section key={p.id} className="grid gap-3">
          <h2 className="font-extrabold">{p.name}</h2>
          {p.steps.map((s) => {
            const key = stepTargetKey(current.draft.id, s.id);
            const def = getIllustration(s.illustration);
            const action = `${def.action}; context: ${s.title}`;
            const rows = listIllustrations(key);
            return (
              <div key={s.id} className="card grid gap-4 p-4 lg:grid-cols-[160px_1fr]">
                <div><Illustration id={s.illustration} className="w-40" /><p className="mt-1 text-xs text-muted">SVG: {s.illustration}</p></div>
                <div className="grid gap-3">
                  <p className="font-bold">{String(s.number).padStart(2, "0")} {s.title}</p>
                  <details><summary className="cursor-pointer text-xs text-muted">Prompt</summary><p className="mt-1 text-xs">{buildPrompt(action)}</p></details>
                  <div className="flex flex-wrap gap-2">
                    <form action={generateIllustrationAction}>
                      <input type="hidden" name="targetKey" value={key} /><input type="hidden" name="action" value={action} /><input type="hidden" name="alt" value={s.illustrationAlt ?? def.alt} /><input type="hidden" name="back" value={back} />
                      <button className="btn btn-secondary min-h-9 text-sm" disabled={!oa.configured}>Generuj</button>
                    </form>
                    <form action={generateIllustrationAction}>
                      <input type="hidden" name="targetKey" value={key} /><input type="hidden" name="action" value={action} /><input type="hidden" name="alt" value={s.illustrationAlt ?? def.alt} /><input type="hidden" name="back" value={back} /><input type="hidden" name="force" value="1" />
                      <button className="btn btn-ghost min-h-9 text-sm" disabled={!oa.configured}>Regeneruj</button>
                    </form>
                    <form action={uploadIllustrationAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="targetKey" value={key} /><input type="hidden" name="back" value={back} />
                      <input type="file" name="file" accept="image/png,image/jpeg,image/webp" className="text-xs" />
                      <input name="alt" required placeholder="Tekst alternatywny" defaultValue={def.alt} className="field-input min-h-9 max-w-xs py-1 text-sm" />
                      <button className="btn btn-ghost min-h-9 text-sm">Wgraj ręcznie</button>
                    </form>
                  </div>
                  {rows.length > 0 && (
                    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {rows.map((r) => (
                        <li key={r.id} className="rounded-md border border-line p-2 text-xs">
                          {r.file_name ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`/api/illustrations/${r.id}`} alt={r.alt} className="w-full rounded-sm" />
                          ) : (<p className="text-urgent">{r.error}</p>)}
                          <p className="mt-1 font-bold">{STATUS[r.status]}</p>
                          <p className="text-muted">{r.source} · {r.model ?? "—"} · {r.prompt_version ?? ""} · {r.created_at.slice(0, 10)}</p>
                          {(r.status === "pending" || r.status === "approved" || r.status === "manual") && (
                            <form action={illustrationStatusAction} className="mt-2 grid gap-1">
                              <input type="hidden" name="id" value={r.id} /><input type="hidden" name="back" value={back} />
                              <input name="alt" defaultValue={r.alt} className="field-input min-h-8 py-1 text-xs" aria-label="Tekst alternatywny" />
                              <span className="flex gap-1">
                                {r.status === "pending" && <button name="status" value="approved" className="btn btn-secondary min-h-8 px-2 py-1 text-xs">Zatwierdź</button>}
                                <button name="status" value="rejected" className="btn btn-ghost min-h-8 px-2 py-1 text-xs text-urgent">Odrzuć</button>
                              </span>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
