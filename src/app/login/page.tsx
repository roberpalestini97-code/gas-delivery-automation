"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Contraseña incorrecta");
      return;
    }
    router.push(params.get("next") || "/pedidos");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="panel w-full max-w-md p-8 shadow-sm"
      style={{ animation: "fadeUp 0.5s ease" }}
    >
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)] mb-2">
        Back office
      </p>
      <h1
        className="text-4xl mb-2"
        style={{ fontFamily: "var(--font-brand), serif" }}
      >
        El Bárbara
      </h1>
      <p className="text-[var(--muted)] mb-6">
        Pedidos de gas envasado, conversaciones y despacho.
      </p>
      <label className="block text-sm mb-2">Contraseña</label>
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="barbara-demo"
        autoFocus
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
    <main className="min-h-screen flex items-center justify-center p-6">
      <Suspense fallback={<div className="panel p-8">Cargando…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}