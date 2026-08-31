"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Login failed.");

      const next = params.get("next");
      // Only follow a same-site path, so a crafted ?next= cannot bounce the
      // browser to another origin after a successful login.
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
      setBusy(false);
    }
  };

  return (
    <form className="card card-lg login-card" onSubmit={submit}>
      <h1>Sign in</h1>
      <p className="card-note">Private workspace.</p>

      <div className="field">
        <label className="section-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
          autoComplete="current-password"
          style={{
            width: "100%",
            font: "inherit",
            color: "var(--ink)",
            background: "var(--well)",
            border: "1px solid var(--edge-2)",
            borderRadius: "var(--r)",
            padding: "0.62rem 0.8rem",
          }}
        />
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      <button
        className="btn btn-primary btn-lg"
        type="submit"
        disabled={busy || password.length === 0}
        style={{ width: "100%" }}
      >
        {busy && <span className="spinner" />}
        Continue
      </button>
    </form>
  );
}

export default function Login() {
  return (
    <main className="page page-narrow login-page">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
