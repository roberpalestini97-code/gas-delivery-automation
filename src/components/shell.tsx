"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/conexion", label: "Conexión" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link href="/pedidos" className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.svg"
              alt="El Barba Gas"
              width={168}
              height={52}
              className="h-10 w-auto"
            />
            <div className="hidden sm:block min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Operaciones
              </p>
              <p className="text-sm font-semibold text-[var(--ink)] truncate">
                Back office
              </p>
            </div>
          </Link>
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
