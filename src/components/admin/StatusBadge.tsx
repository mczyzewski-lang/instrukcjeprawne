import { EDITORIAL_STATUS_LABEL, type EditorialStatus } from "@/lib/types";

const CLS: Record<EditorialStatus, string> = {
  draft: "border-line text-muted",
  review: "border-gold text-navy bg-gold-soft",
  published: "border-navy text-white bg-navy",
  archived: "border-line text-muted line-through",
};

export function StatusBadge({ status }: { status: EditorialStatus }) {
  return <span className={`badge ${CLS[status]}`}>{EDITORIAL_STATUS_LABEL[status]}</span>;
}

export function ConfigRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <span>
        <span className="font-semibold">{label}</span>
        <span className="block text-xs text-muted">{detail}</span>
      </span>
      <span className={`badge ${ok ? "border-navy text-navy" : "border-urgent text-urgent"}`}>{ok ? "Skonfigurowane" : "Brak konfiguracji"}</span>
    </li>
  );
}
