"use client";

import { useEffect, useState } from "react";

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
  paymentBreakdown: Record<string, number>;
};

export default function MetricasPage() {
  const [data, setData] = useState<Metrics | null>(null);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <p className="text-[var(--muted)]">Cargando métricas…</p>;
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
      <div>
        <h2
          className="text-2xl"
          style={{ fontFamily: "var(--font-brand), serif" }}
        >
          Métricas
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Consultas sobre la base: ventas, camiones, pagos y fallidos.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="panel p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              {c.label}
            </p>
            <p
              className="text-3xl mt-1"
              style={{ fontFamily: "var(--font-brand), serif" }}
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
              {Object.entries(data.paymentBreakdown).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}