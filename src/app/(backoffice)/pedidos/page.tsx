"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DeliveryBadge, PaymentBadge } from "@/components/status";
import { orderCode } from "@/lib/utils";

type OrderRow = {
  id: number;
  address: string;
  quantity: number;
  deliveryStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  zone: string | null;
  customer: { phone: string; name: string | null } | null;
  driver: { name: string } | null;
  product: { name: string } | null;
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2
          className="text-2xl"
          style={{ fontFamily: "var(--font-brand), serif" }}
        >
          Pedidos
        </h2>
        <p className="text-[var(--muted)] text-sm">
          La planilla operativa: todo lo que antes vivía en el Excel.
        </p>
      </div>
      <div className="panel table-wrap">
        {loading ? (
          <p className="p-6 text-[var(--muted)]">Cargando pedidos…</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-[var(--muted)]">
            Todavía no hay pedidos. Andá a <Link href="/demo" className="underline">Demo WA</Link> para simular uno.
          </p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Dirección</th>
                <th>Producto</th>
                <th>Entrega</th>
                <th>Pago</th>
                <th>Repartidor</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/pedidos/${o.id}`} className="font-semibold text-[var(--accent)]">
                      {orderCode(o.id)}
                    </Link>
                  </td>
                  <td>
                    <div>{o.customer?.name || "—"}</div>
                    <div className="text-xs text-[var(--muted)]">{o.customer?.phone}</div>
                  </td>
                  <td>
                    <div>{o.address}</div>
                    {o.zone ? (
                      <div className="text-xs text-[var(--muted)]">Zona {o.zone}</div>
                    ) : null}
                  </td>
                  <td>
                    {o.quantity} × {o.product?.name || "—"}
                  </td>
                  <td>
                    <DeliveryBadge status={o.deliveryStatus} />
                  </td>
                  <td>
                    <PaymentBadge status={o.paymentStatus} />
                  </td>
                  <td>{o.driver?.name || "—"}</td>
                  <td className="text-xs text-[var(--muted)] whitespace-nowrap">
                    {o.createdAt.replace("T", " ").slice(0, 16)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}