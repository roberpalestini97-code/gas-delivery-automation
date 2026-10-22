"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/pedidos", label: "Pedidos" },
  { href: "/conversaciones", label: "Conversaciones" },
  { href: "/acciones", label: "Acciones" },
  { href: "/metricas", label: "Métricas" },
  { href: "/repartidores", label: "Repartidores" },
  { href: "/productos", label: "Productos" },
];

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-col lg:flex-row lg:flex-wrap gap-1", className)}>
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "px-3 py-2 lg:py-1.5 rounded-md text-sm transition-colors",
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
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/pedidos" className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.svg"
              alt="El Barba Gas"
              width={168}
              height={52}
              className="h-9 sm:h-10 w-auto"
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

          <div className="hidden lg:flex items-center gap-3">
            <NavLinks pathname={pathname} />
            <Button variant="outline" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)]"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open ? (
          <div className="lg:hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-3 shadow-sm">
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <Button variant="outline" className="w-full" onClick={logout}>
              Salir
            </Button>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 flex-1">{children}</main>

      <footer className="border-t border-[var(--border)] py-3 text-center text-[11px] text-[var(--muted)]">
        <span>El Barba Gas · back office</span>
        <span className="mx-2 opacity-40">·</span>
        <Link href="/demo" className="hover:text-[var(--accent)] underline-offset-2 hover:underline">
          Demo WA
        </Link>
        <span className="mx-1 opacity-40">·</span>
        <Link href="/conexion" className="hover:text-[var(--accent)] underline-offset-2 hover:underline">
          Conexión
        </Link>
      </footer>
    </div>
  );
}