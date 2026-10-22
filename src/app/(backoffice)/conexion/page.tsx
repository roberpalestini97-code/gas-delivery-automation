"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Status = {
  demoMode: boolean;
  whatsapp: {
    configured: boolean;
    mode: string;
    verifyToken: string;
    webhookPath: string;
    apiVersion: string;
    tokenSet: boolean;
    phoneNumberIdSet: boolean;
  };
  sheets: { configured: boolean; mode: string };
  database: { orders: number; drivers: number; products: number; path: string };
  checklist: Array<{ id: string; label: string; done: boolean }>;
  recentAudit: Array<{ id: number; kind: string; summary: string; createdAt: string }>;
};

export default function ConexionPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [sampleMsg, setSampleMsg] = useState("");
  const [loadingSample, setLoadingSample] = useState(false);

  async function load() {
    const res = await fetch("/api/status");
    setStatus(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function loadSampleData() {
    setLoadingSample(true);
    setSampleMsg("");
    const res = await fetch("/api/demo/sample-data", { method: "POST" });
    const data = await res.json();
    setLoadingSample(false);
    if (!res.ok) {
      setSampleMsg(data.error || "Error");
      return;
    }
    setSampleMsg(`Cargados ${data.createdOrderIds.length} pedidos de ejemplo.`);
    load();
  }

  if (!status) {
    return <p className="text-[var(--muted)]">Cargando estado…</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-2xl"
          style={{ fontFamily: "var(--font-brand), sans-serif" }}
        >
          Conexión
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Todo listo para trabajar sin Meta. Cuando tengas el token de tu WhatsApp
          de prueba, pegalo en <code>.env.local</code> y reiniciá el server.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">WhatsApp</h3>
            <Badge tone={status.whatsapp.configured ? "success" : "warn"}>
              {status.whatsapp.configured ? "Live" : "Demo"}
            </Badge>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Modo: <code>{status.whatsapp.mode}</code>
          </p>
          <p className="text-sm">
            Token: {status.whatsapp.tokenSet ? "cargado" : "pendiente"} · Phone
            ID: {status.whatsapp.phoneNumberIdSet ? "cargado" : "pendiente"}
          </p>
          <p className="text-xs text-[var(--muted)] break-all">
            Webhook: <code>{status.whatsapp.webhookPath}</code>
            <br />
            Verify: <code>{status.whatsapp.verifyToken}</code>
            <br />
            API: <code>{status.whatsapp.apiVersion}</code>
          </p>
        </div>

        <div className="panel p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Google Sheets</h3>
            <Badge tone={status.sheets.configured ? "success" : "muted"}>
              {status.sheets.configured ? "Live" : "Opcional"}
            </Badge>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Modo: <code>{status.sheets.mode}</code>
          </p>
          <p className="text-sm">
            Sin credenciales, el append queda en el audit local y el back office
            es la fuente de verdad.
          </p>
        </div>

        <div className="panel p-4 space-y-2">
          <h3 className="font-semibold">Base local</h3>
          <p className="text-sm">
            {status.database.orders} pedidos · {status.database.drivers}{" "}
            repartidores · {status.database.products} productos
          </p>
          <p className="text-xs text-[var(--muted)] break-all">
            <code>{status.database.path}</code>
          </p>
          <Button
            size="sm"
            variant="secondary"
            disabled={loadingSample}
            onClick={loadSampleData}
          >
            {loadingSample ? "Cargando…" : "Cargar pedidos de ejemplo"}
          </Button>
          {sampleMsg ? (
            <p className="text-xs text-emerald-800">{sampleMsg}</p>
          ) : null}
        </div>
      </div>

      <div className="panel p-4">
        <h3 className="font-semibold mb-3">Checklist hasta producción</h3>
        <ul className="space-y-2">
          {status.checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm">
              <Badge tone={item.done ? "success" : "warn"}>
                {item.done ? "ok" : "todo"}
              </Badge>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--muted)] mt-4">
          Guía paso a paso: <code>docs/meta-setup.md</code>
        </p>
      </div>

      <div className="panel p-4">
        <h3 className="font-semibold mb-3">Últimos eventos de sistema</h3>
        {status.recentAudit.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Sin eventos</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {status.recentAudit.map((ev) => (
              <li key={ev.id}>
                <span className="text-[var(--muted)] mr-2">
                  {ev.createdAt.replace("T", " ").slice(0, 19)}
                </span>
                <code className="text-xs">{ev.kind}</code> — {ev.summary}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}