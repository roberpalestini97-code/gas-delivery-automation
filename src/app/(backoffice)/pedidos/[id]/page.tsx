"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DeliveryBadge, PaymentBadge } from "@/components/status";
import { orderCode } from "@/lib/utils";

type Detail = {
  order: {
    id: number;
    address: string;
    zone: string | null;
    quantity: number;
    paymentMethod: string;
    paymentStatus: string;
    deliveryStatus: string;
    createdAt: string;
  };
  customer: { name: string | null; phone: string } | null;
  driver: { name: string; phone: string } | null;
  product: { name: string } | null;
  events: Array<{
    id: number;
    actor: string;
    actionCode: string | null;
    summary: string;
    createdAt: string;
  }>;
  dispatches: Array<{ waMessageId: string; createdAt: string }>;
  messages: Array<{
    id: number;
    direction: string;
    body: string;
    createdAt: string;
  }>;
};

export default function PedidoDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("No encontrado");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) {
    return <p className="text-red-700">{error}</p>;
  }
  if (!data) {
    return <p className="text-[var(--muted)]">Cargando…</p>;
  }

  const { order, customer, driver, product, events, dispatches, messages } = data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/pedidos" className="text-sm text-[var(--muted)]">
            ← Pedidos
          </Link>
          <h2
            className="text-3xl mt-1"
            style={{ fontFamily: "var(--font-brand), sans-serif" }}
          >
            {orderCode(order.id)}
          </h2>
          <p className="text-[var(--muted)]">
            {product?.name} · {order.quantity} u · {order.address}
          </p>
        </div>
        <div className="flex gap-2">
          <DeliveryBadge status={order.deliveryStatus} />
          <PaymentBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-4 space-y-2">
          <h3 className="font-semibold">Cliente</h3>
          <p>{customer?.name || "Sin nombre"}</p>
          <p className="text-sm text-[var(--muted)]">{customer?.phone}</p>
        </div>
        <div className="panel p-4 space-y-2">
          <h3 className="font-semibold">Repartidor</h3>
          <p>{driver?.name || "Sin asignar"}</p>
          <p className="text-sm text-[var(--muted)]">{driver?.phone}</p>
        </div>
        <div className="panel p-4 space-y-2">
          <h3 className="font-semibold">Despacho WA</h3>
          {dispatches.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Sin mensaje aún</p>
          ) : (
            dispatches.map((d) => (
              <p key={d.waMessageId} className="text-xs break-all">
                {d.waMessageId}
              </p>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h3 className="font-semibold mb-3">Timeline</h3>
          {events.length === 0 ? (
            <p className="text-[var(--muted)] text-sm">Sin eventos</p>
          ) : (
            <div className="timeline">
              {events.map((ev) => (
                <div key={ev.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div>
                    <p className="text-sm font-medium">{ev.summary}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {ev.actor}
                      {ev.actionCode ? ` · ${ev.actionCode}` : ""} ·{" "}
                      {ev.createdAt.replace("T", " ").slice(0, 19)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel p-4">
          <h3 className="font-semibold mb-3">Chat del cliente</h3>
          <div className="flex flex-col gap-2 max-h-[420px] overflow-auto">
            {messages.length === 0 ? (
              <p className="text-[var(--muted)] text-sm">Sin mensajes</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-bubble ${m.direction === "inbound" ? "chat-in" : "chat-out"}`}
                >
                  {m.body}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}