"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/pedidos", label: "Pedidos" },
  { href: "/conversaciones", label: "Conversaciones" },
  { href: "/acciones", label: "Acciones" },
  { href: "/metricas", label: "Métricas" },
  { href: "/repartidores", label: "Repartidores" },
  { href: "/productos", label: "Productos" },
  { href: "/demo", label: "Demo WA" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Operaciones
            </p>
            <h1
              className="text-2xl md:text-3xl leading-none"
              style={{ fontFamily: "var(--font-brand), serif" }}
            >
              El Bárbara
            </h1>
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "hover:bg-[var(--surface-2)] text-[var(--ink)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button variant="outline" size="sm" onClick={logout}>
            Salir
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}