import { notFound } from "next/navigation";
import { InstructionView } from "@/components/instruction/InstructionView";
import { getInstructionForEdit } from "@/lib/repo/content";

export const metadata = { title: "Podgląd", robots: { index: false, follow: false } };

export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cur = getInstructionForEdit(id);
  if (!cur) notFound();
  return (
    <div className="-mx-4 sm:-mx-6">
      <InstructionView ins={cur.draft} reviewed={false} preview />
    </div>
  );
}
