"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Contraseña incorrecta");
        setLoading(false);
        return;
      }
      const next = params.get("next") || "/pedidos";
      // Full navigation so the session cookie is always picked up by middleware
      window.location.assign(next);
    } catch {
      setError("No se pudo iniciar sesión. Probá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="panel w-full max-w-md p-8 shadow-sm"
      style={{ animation: "fadeUp 0.5s ease" }}
    >
      <div className="flex justify-center mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo.svg"
          alt="El Barba Gas"
          width={280}
          height={86}
          className="h-[86px] w-auto"
        />
      </div>
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)] mb-2 text-center">
        Back office
      </p>
      <p className="text-[var(--muted)] mb-6 text-center text-sm">
        Pedidos de gas envasado, conversaciones y despacho.
      </p>
      <label className="block text-sm mb-2">Contraseña</label>
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="barbara-demo"
        autoFocus
        autoComplete="current-password"
      />
      {error ? (
        <p className="text-sm text-red-700 mt-2">{error}</p>
      ) : (
        <p className="text-xs text-[var(--muted)] mt-2">
          Demo local: <code>barbara-demo</code>
        </p>
      )}
      <Button className="w-full mt-5" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>
      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: "url(/brand/el-barba-gas-source.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.05)",
        }}
      />
      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={<div className="panel p-8">Cargando…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}