"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Metrics = {
  totals: {
    orders: number;
    ordersToday: number;
    ordersYesterday: number;
    unitsYesterday: number;
    unitsToday: number;
    conversations: number;
    customerConversations: number;
    notHome: number;
    delivered: number;
    arrivingEvents: number;
  };
  byDriver: Array<{
    driverId: number;
    name: string;
    orders: number;
    delivered: number;
  }>;
  paymentBreakdown: Array<{ key: string; label: string; count: number }>;
};

export default function MetricasPage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/metrics");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Error ${res.status}`);
      }
      if (!json.totals) {
        throw new Error("Respuesta de métricas incompleta");
      }
      setData(json as Metrics);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "No se pudieron cargar las métricas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <p className="text-[var(--muted)]">Cargando métricas…</p>;
  }

  if (error || !data) {
    return (
      <div className="panel p-6 space-y-3">
        <p className="text-red-700">{error || "Sin datos"}</p>
        <Button size="sm" variant="secondary" onClick={load}>
          Reintentar
        </Button>
      </div>
    );
  }

  const cards = [
    { label: "Pedidos hoy", value: data.totals.ordersToday },
    { label: "Unidades hoy", value: data.totals.unitsToday },
    { label: "Pedidos ayer", value: data.totals.ordersYesterday },
    { label: "Unidades ayer", value: data.totals.unitsYesterday },
    { label: "Conversaciones", value: data.totals.customerConversations },
    { label: "Entregados", value: data.totals.delivered },
    { label: "No estaba", value: data.totals.notHome },
    { label: "Avisos «estoy llegando»", value: data.totals.arrivingEvents },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className="text-2xl"
            style={{ fontFamily: "var(--font-brand), sans-serif" }}
          >
            Métricas
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Consultas sobre la base: ventas, camiones, pagos y fallidos.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load}>
          Actualizar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="panel p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              {c.label}
            </p>
            <p
              className="text-3xl mt-1"
              style={{ fontFamily: "var(--font-brand), sans-serif" }}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h3 className="font-semibold mb-3">Por camión / repartidor</h3>
          <table className="data">
            <thead>
              <tr>
                <th>Repartidor</th>
                <th>Pedidos</th>
                <th>Entregados</th>
              </tr>
            </thead>
            <tbody>
              {data.byDriver.map((d) => (
                <tr key={d.driverId}>
                  <td>{d.name}</td>
                  <td>{d.orders}</td>
                  <td>{d.delivered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel p-4">
          <h3 className="font-semibold mb-3">Pagos</h3>
          <table className="data">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {data.paymentBreakdown.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
