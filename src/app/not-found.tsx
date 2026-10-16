import Link from "next/link";
import { Illustration } from "@/components/ui/Illustration";

export default function NotFound() {
  return (
    <div className="container-text py-20 text-center">
      <Illustration id="person-question" decorative className="mx-auto w-48" />
      <h1 className="mt-6 text-h2 font-extrabold">Nie znaleźliśmy tej strony</h1>
      <p className="mt-3 text-muted">Mogła zostać przeniesiona albo jeszcze nie została opublikowana.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Strona główna</Link>
        <Link href="/instrukcje" className="btn btn-secondary">Wszystkie instrukcje</Link>
      </div>
    </div>
  );
}
