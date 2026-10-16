"use client";

import { useActionState } from "react";
import { importCsvAction, type ImportPreview } from "@/app/admin/actions";

export function CsvImport() {
  const [state, action, pending] = useActionState<ImportPreview | undefined, FormData>(importCsvAction, undefined);
  const valid = state?.rows.filter((r) => r.errors.length === 0 && !r.exists).length ?? 0;
  return (
    <form action={action} className="grid gap-4">
      <label><span className="field-label">Plik CSV</span><input type="file" name="file" accept=".csv,text/csv" className="field-input py-2" /></label>
      <label><span className="field-label">…albo wklej treść CSV</span><textarea name="csv" rows={8} className="field-input font-mono text-xs" placeholder={"title,category,actions\nCzy …?,dlugi-i-komornik,Krok 1 | Krok 2"} /></label>
      <div className="flex flex-wrap gap-2">
        <button name="mode" value="preview" className="btn btn-secondary" disabled={pending}>Podgląd</button>
        <button name="mode" value="import" className="btn btn-primary" disabled={pending}>Importuj jako szkice</button>
      </div>
      {state && (
        <div role="status" className="card p-4 text-sm">
          {state.imported !== undefined ? <p className="font-bold">Zaimportowano: {state.imported}</p> : <p className="font-bold">Do zaimportowania: {valid} z {state.rows.length}</p>}
          <ul className="mt-3 grid gap-1">
            {state.rows.map((r) => (
              <li key={`${r.line}-${r.slug}`} className={r.errors.length ? "text-urgent" : r.exists ? "text-muted" : ""}>
                Wiersz {r.line}: {r.title || "(brak tytułu)"} {r.exists && "– już istnieje, pominięto"} {r.errors.length > 0 && `– ${r.errors.join("; ")}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
