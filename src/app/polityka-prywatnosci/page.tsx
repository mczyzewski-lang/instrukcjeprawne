import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LEGAL_ENTITY } from "@/lib/config";
import { listLeadConfigs } from "@/lib/repo/leads";

export const metadata: Metadata = { title: "Polityka prywatności", alternates: { canonical: "/polityka-prywatnosci" } };
export const revalidate = 300;

export default function Privacy() {
  const partners = [...new Set(listLeadConfigs().map((c) => c.partnerName))];
  return (
    <div className="container-text py-8">
      <Breadcrumbs items={[{ name: "Polityka prywatności", href: "/polityka-prywatnosci" }]} />
      <h1 className="mt-8 text-h1 font-extrabold">Polityka prywatności</h1>
      <p className="mt-3 text-sm text-muted">Dokument wymaga uzupełnienia danych operatora i weryfikacji prawnej przed uruchomieniem produkcyjnym.</p>
      <div className="prose-simple mt-10 grid gap-10">
        <section>
          <h2 className="text-xl font-extrabold">Kto odpowiada za Twoje dane</h2>
          <p className="mt-2">Administratorem danych serwisu jest: {LEGAL_ENTITY.operator}. Kontakt: {LEGAL_ENTITY.contactEmail}.</p>
        </section>
        <section>
          <h2 className="text-xl font-extrabold">Korzystanie z instrukcji</h2>
          <p className="mt-2">
            Instrukcje, drzewa decyzji i PDF działają bez zakładania konta i bez podawania danych. Odpowiedzi w drzewach decyzji i postęp kroków są zapisywane
            tylko w Twojej przeglądarce (localStorage) i nie trafiają na nasz serwer.
          </p>
        </section>
        <section id="formularz">
          <h2 className="text-xl font-extrabold">Formularz rozmowy z ekspertem</h2>
          <ul className="list-dash mt-3">
            <li>Zbieramy: imię, numer telefonu, opcjonalnie e-mail oraz temat instrukcji i wybraną drogę.</li>
            <li>Cel: kontakt w sprawie, o którą prosisz (podstawa: Twoje żądanie i zgoda na kontakt).</li>
            <li>Odbiorca: współpracujący podmiot właściwy dla tematu ({partners.join(", ")}), który prowadzi rozmowę.</li>
            <li>Przechowywanie: do czasu obsługi zgłoszenia, nie dłużej niż 12 miesięcy, chyba że nawiążesz współpracę z partnerem.</li>
            <li>Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, wycofania zgody i skargi do Prezesa UODO.</li>
          </ul>
        </section>
        <section id="analityka">
          <h2 className="text-xl font-extrabold">Analityka</h2>
          <p className="mt-2">
            Tylko po Twojej zgodzie liczymy anonimowo zdarzenia, np. otwarcie instrukcji, ukończenie drzewa decyzji, pobranie PDF. Nie używamy ciasteczek
            reklamowych ani zewnętrznych narzędzi śledzących. Nie zapisujemy adresu IP ani treści wpisywanych w formularze. Identyfikator sesji jest losowy i
            znika po zamknięciu karty. Zgodę możesz zmienić w „Ustawieniach prywatności” w stopce.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-extrabold">Ciasteczka</h2>
          <p className="mt-2">Serwis publiczny nie używa ciasteczek. Panel redakcyjny używa jednego niezbędnego ciasteczka sesji administratora.</p>
        </section>
      </div>
    </div>
  );
}
