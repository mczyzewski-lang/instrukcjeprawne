import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { adminPassword, DEV_ADMIN_PASSWORD, isProduction } from "@/lib/config";

export const metadata: Metadata = { title: "Logowanie do panelu", robots: { index: false, follow: false } };

export default function LoginPage() {
  const configured = Boolean(process.env.ADMIN_PASSWORD);
  return (
    <div className="container-text max-w-md py-16">
      <h1 className="text-h2 font-extrabold">Panel redakcyjny</h1>
      {!adminPassword() ? (
        <p className="mt-6 rounded-md border border-urgent bg-urgent-soft p-4 text-sm">
          Panel jest wyłączony. Ustaw zmienną środowiskową <code>ADMIN_PASSWORD</code> (i najlepiej <code>ADMIN_SESSION_SECRET</code>), a następnie uruchom aplikację ponownie.
        </p>
      ) : (
        <>
          {!configured && !isProduction() && (
            <p className="mt-6 rounded-md border border-gold bg-gold-soft p-4 text-sm">
              Tryb lokalny: <code>ADMIN_PASSWORD</code> nie jest ustawione, obowiązuje hasło deweloperskie <code>{DEV_ADMIN_PASSWORD}</code>. W produkcji panel bez hasła jest wyłączony.
            </p>
          )}
          <LoginForm />
        </>
      )}
    </div>
  );
}
