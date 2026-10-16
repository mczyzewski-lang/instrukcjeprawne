"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { publishQuestionAction, saveQuestionAction, unpublishQuestionAction, type ActionResult } from "@/app/admin/actions";
import { slugify } from "@/lib/csv";
import type { Question, RelatedVideo, SourceReference } from "@/lib/types";

const CATS: [string, string][] = [
  ["dlugi-i-komornik", "Długi i komornik"],
  ["firma-w-trudnosciach", "Firma w trudnościach"],
  ["podatki-przedsiebiorcy", "Podatki przedsiębiorcy"],
  ["ochrona-marki", "Ochrona marki"],
  ["rozwod-i-rodzina", "Rozwód i rodzina"],
  ["kredyty-i-banki", "Kredyty i banki"],
  ["umowy-i-konsumenci", "Umowy i konsumenci"],
  ["inne-sprawy", "Inne sprawy"],
];

interface Props {
  initial: Question;
  hasPublished: boolean;
  instructions: { slug: string; title: string; paths: { id: string; name: string }[] }[];
}

export function QuestionEditor({ initial, hasPublished, instructions }: Props) {
  const router = useRouter();
  const [q, setQ] = useState<Question>(initial);
  const [actionsRaw, setActionsRaw] = useState(initial.actions.join("\n"));
  const [relatedRaw, setRelatedRaw] = useState(initial.relatedQuestions.join("\n"));
  const [sourcesRaw, setSourcesRaw] = useState(JSON.stringify(initial.sourceReferences, null, 2));
  const [sourcesErr, setSourcesErr] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const patch = (p: Partial<Question>) => setQ((x) => ({ ...x, ...p }));
  const ins = instructions.find((i) => i.slug === q.relatedInstruction);
  const video = q.relatedVideo;
  const setVideo = (p: Partial<RelatedVideo> | null) => patch({ relatedVideo: p === null ? null : ({ platform: "youtube", url: "", title: "", ...(video ?? {}), ...p } as RelatedVideo) });

  const finalDoc = (): Question => {
    const slug = q.slug || slugify(q.title);
    return { ...q, slug, id: q.id || `q-${slug}`, relatedVideo: video && video.url ? video : null };
  };

  const run = (fn: () => Promise<ActionResult & { id?: string }>) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      if (r.ok && !initial.id && "id" in r && r.id) router.replace(`/admin/pytania/${r.id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  return (
    <div className="grid gap-5">
      {result && (
        <div role="status" className={`rounded-md border p-4 text-sm ${result.ok ? "border-navy bg-white" : "border-urgent bg-urgent-soft"}`}>
          {result.message && <p className="font-bold">{result.message}</p>}
          {result.errors && <ul className="list-dash">{result.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" disabled={pending || Boolean(sourcesErr)} onClick={() => run(() => saveQuestionAction(JSON.stringify(finalDoc()), "draft"))}>Zapisz szkic</button>
        <button type="button" className="btn btn-secondary" disabled={pending || Boolean(sourcesErr)} onClick={() => run(() => saveQuestionAction(JSON.stringify(finalDoc()), "review"))}>Wyślij do zatwierdzenia</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending || Boolean(sourcesErr)}
          onClick={() =>
            run(async () => {
              const r = await saveQuestionAction(JSON.stringify(finalDoc()), "review");
              if (!r.ok || !r.id) return r;
              return publishQuestionAction(r.id);
            })
          }
        >
          Zatwierdź i opublikuj
        </button>
        {initial.id && <a className="btn btn-ghost" href={`/admin/podglad/pytania/${initial.id}`} target="_blank" rel="noopener">Podgląd ↗</a>}
        {hasPublished && <button type="button" className="btn btn-ghost text-urgent" onClick={() => run(() => unpublishQuestionAction(q.id, false))}>Wycofaj publikację</button>}
        {initial.id && <button type="button" className="btn btn-ghost" onClick={() => run(() => unpublishQuestionAction(q.id, true))}>Archiwizuj</button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="field-label">Pytanie (naturalnym językiem)</span><input className="field-input" value={q.title} onChange={(e) => patch({ title: e.target.value })} /></label>
        <label><span className="field-label">Slug</span><input className="field-input" value={q.slug} placeholder={slugify(q.title)} disabled={Boolean(initial.id)} onChange={(e) => patch({ slug: e.target.value })} /></label>
        <label><span className="field-label">Kategoria</span>
          <select className="field-input" value={q.category} onChange={(e) => patch({ category: e.target.value as Question["category"] })}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <label className="sm:col-span-2"><span className="field-label">Krótka odpowiedź (1–3 zdania)</span><textarea rows={3} className="field-input" value={q.answer} onChange={(e) => patch({ answer: e.target.value })} /></label>
        <label className="sm:col-span-2"><span className="field-label">Konkretne działania (jedno w linii)</span>
          <textarea rows={4} className="field-input" value={actionsRaw} onChange={(e) => { setActionsRaw(e.target.value); patch({ actions: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) }); }} />
        </label>
        <label className="sm:col-span-2"><span className="field-label">Dłuższe wyjaśnienie (opcjonalnie)</span><textarea rows={4} className="field-input" value={q.explanation ?? ""} onChange={(e) => patch({ explanation: e.target.value || undefined })} /></label>
        <label><span className="field-label">Powiązana instrukcja</span>
          <select className="field-input" value={q.relatedInstruction ?? ""} onChange={(e) => patch({ relatedInstruction: e.target.value || null, relatedPath: null })}>
            <option value="">— brak —</option>
            {instructions.map((i) => <option key={i.slug} value={i.slug}>{i.title}</option>)}
          </select>
        </label>
        <label><span className="field-label">Ścieżka decyzyjna / droga</span>
          <select className="field-input" value={q.relatedPath ?? ""} onChange={(e) => patch({ relatedPath: e.target.value || null })} disabled={!ins}>
            <option value="">— brak —</option>
            {ins?.paths.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label><span className="field-label">Powiązane pytania (slugi, linie)</span>
          <textarea rows={3} className="field-input" value={relatedRaw} onChange={(e) => { setRelatedRaw(e.target.value); patch({ relatedQuestions: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) }); }} />
        </label>
        <label><span className="field-label">Priorytet w kolejce</span>
          <select className="field-input" value={q.priority ?? ""} onChange={(e) => patch({ priority: (e.target.value || undefined) as Question["priority"] })}>
            <option value="">—</option><option value="high">wysoki</option><option value="medium">średni</option><option value="low">niski</option>
          </select>
        </label>
        <label className="sm:col-span-2"><span className="field-label">Źródła (JSON: id, title, publisher, url, verifiedAt, confidence)</span>
          <textarea rows={8} className="field-input font-mono text-xs" value={sourcesRaw} aria-invalid={Boolean(sourcesErr)} onChange={(e) => {
            setSourcesRaw(e.target.value);
            try { patch({ sourceReferences: JSON.parse(e.target.value) as SourceReference[] }); setSourcesErr(""); } catch { setSourcesErr("Niepoprawny JSON"); }
          }} />
          {sourcesErr && <span className="field-error block">{sourcesErr}</span>}
        </label>
      </div>

      <fieldset className="card grid gap-3 p-4 sm:grid-cols-2">
        <legend className="px-1 font-extrabold">Film (opcjonalnie – dodatek, nie zastępuje odpowiedzi)</legend>
        <label><span className="field-label">Platforma</span>
          <select className="field-input" value={video?.platform ?? ""} onChange={(e) => (e.target.value ? setVideo({ platform: e.target.value as RelatedVideo["platform"] }) : setVideo(null))}>
            <option value="">— brak —</option><option value="own">Własne wideo</option><option value="instagram">Instagram Reels</option><option value="tiktok">TikTok</option><option value="youtube">YouTube Shorts</option>
          </select>
        </label>
        <label><span className="field-label">Adres URL</span><input className="field-input" value={video?.url ?? ""} disabled={!video} onChange={(e) => setVideo({ url: e.target.value })} /></label>
        <label><span className="field-label">Tytuł filmu</span><input className="field-input" value={video?.title ?? ""} disabled={!video} onChange={(e) => setVideo({ title: e.target.value })} /></label>
        <label><span className="field-label">Data publikacji</span><input type="date" className="field-input" value={video?.publishedAt ?? ""} disabled={!video} onChange={(e) => setVideo({ publishedAt: e.target.value || undefined })} /></label>
        <label className="sm:col-span-2"><span className="field-label">Transkrypcja</span><textarea rows={4} className="field-input" value={video?.transcript ?? ""} disabled={!video} onChange={(e) => setVideo({ transcript: e.target.value || undefined })} /></label>
      </fieldset>
    </div>
  );
}
