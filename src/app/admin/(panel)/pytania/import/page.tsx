import { CsvImport } from "@/components/admin/CsvImport";
import { QUESTION_CSV_COLUMNS } from "@/lib/csv";

export const metadata = { title: "Import pytań z CSV" };

export default function ImportPage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <h1 className="text-h2 font-extrabold">Import pytań z CSV</h1>
      <div className="card p-5 text-sm">
        <p className="font-bold">Format</p>
        <p className="mt-1">Pierwszy wiersz to nagłówki. Wymagane: <code>title</code>, <code>category</code>. Separator: przecinek lub średnik. Wiele wartości w jednej komórce oddziel znakiem <code>|</code>.</p>
        <p className="mt-2 break-words font-mono text-xs">{QUESTION_CSV_COLUMNS.join(", ")}</p>
        <p className="mt-2">Zaimportowane pytania trafiają do kolejki jako <strong>szkice</strong>. Istniejące slugi są pomijane. Źródła z CSV mają status „do weryfikacji”.</p>
      </div>
      <CsvImport />
    </div>
  );
}
