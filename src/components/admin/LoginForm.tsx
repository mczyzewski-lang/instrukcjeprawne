"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="mt-8 grid gap-4">
      <div>
        <label htmlFor="name" className="field-label">Imię i nazwisko (recenzent)</label>
        <input id="name" name="name" required autoComplete="name" className="field-input" defaultValue={state?.name} key={state?.name ?? ""} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Hasło</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field-input" />
      </div>
      {state?.error && <p role="alert" className="field-error">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Logowanie…" : "Zaloguj"}</button>
    </form>
  );
}
