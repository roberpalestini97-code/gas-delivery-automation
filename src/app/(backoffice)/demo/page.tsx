"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orderCode } from "@/lib/utils";

type LogItem = { at: string; title: string; detail?: string };

export default function DemoPage() {
  const [customerPhone, setCustomerPhone] = useState("5491199990001");
  const [log, setLog] = useState<LogItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [dispatchWaId, setDispatchWaId] = useState<string | null>(null);
  const [driverPhone, setDriverPhone] = useState("5491110000001");

  useEffect(() => {
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((d) => {
        if (d.drivers?.[0]?.phone) setDriverPhone(d.drivers[0].phone);
      });
  }, []);

  function pushLog(title: string, detail?: string) {
    setLog((prev) => [
      { at: new Date().toLocaleTimeString(), title, detail },
      ...prev,
    ]);
  }

  async function simulate(body: Record<string, unknown>) {
    const res = await fetch("/api/demo/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error");
    return data;
  }

  async function refreshDispatch() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    const latest = data.orders?.[0];
    if (!latest) return;
    setLastOrderId(latest.id);
    const detail = await fetch(`/api/orders/${latest.id}`).then((r) => r.json());
    const waId = detail.dispatches?.[0]?.waMessageId;
    if (waId) setDispatchWaId(waId);
    if (detail.driver?.phone) setDriverPhone(detail.driver.phone);
  }

  async function runFullDemo() {
    setBusy(true);
    setLog([]);
    try {
      pushLog("Cliente escribe hola");
      await simulate({
        role: "customer",
        phone: customerPhone,
        text: "hola",
        contactName: "María Demo",
      });

      pushLog("Cliente manda dirección");
      await simulate({
        role: "customer",
        phone: customerPhone,
        text: "Av. Corrientes 1234, CABA",
      });

      // fetch products to know id
      const products = await fetch("/api/products").then((r) => r.json());
      const productId = products.products?.[0]?.id || 1;

      pushLog("Cliente elige producto");
      await simulate({
        role: "customer",
        phone: customerPhone,
        text: "Garrafa",
        interactiveId: `product:${productId}`,
      });

      pushLog("Cantidad 2");
      await simulate({
        role: "customer",
        phone: customerPhone,
        text: "2",
        interactiveId: "qty:2",
      });

      pushLog("Pago efectivo");
      await simulate({
        role: "customer",
        phone: customerPhone,
        text: "Efectivo",
        interactiveId: "pay:cash",
      });

      pushLog("Confirma pedido → despacho al repartidor");
      await simulate({
        role: "customer",
        phone: customerPhone,
        text: "Confirmar",
        interactiveId: "confirm:yes",
      });

      await refreshDispatch();
      pushLog("Pedido creado y mensaje al repartidor", "Revisá Pedidos");

      // Need dispatch id for reply context
      const orders = await fetch("/api/orders").then((r) => r.json());
      const orderId = orders.orders?.[0]?.id as number;
      setLastOrderId(orderId);
      const detail = await fetch(`/api/orders/${orderId}`).then((r) => r.json());
      const waId = detail.dispatches?.[0]?.waMessageId as string;
      setDispatchWaId(waId);
      const dPhone = detail.driver?.phone || driverPhone;

      pushLog("Repartidor: estoy llegando (reply al pedido)");
      await simulate({
        role: "driver",
        phone: dPhone,
        text: "estoy llegando",
        interactiveId: "action:arriving",
        contextId: waId,
      });

      pushLog("Repartidor: estoy afuera");
      await simulate({
        role: "driver",
        phone: dPhone,
        text: "estoy afuera",
        interactiveId: "action:outside",
        contextId: waId,
      });

      pushLog("Repartidor: pagó efectivo + entregado");
      await simulate({
        role: "driver",
        phone: dPhone,
        text: "pagó efectivo",
        interactiveId: "action:paid_cash",
        contextId: waId,
      });

      pushLog("Demo completa", orderId ? orderCode(orderId) : undefined);
    } catch (error) {
      pushLog(
        "Error en la demo",
        error instanceof Error ? error.message : "unknown",
      );
    } finally {
      setBusy(false);
      await refreshDispatch();
    }
  }

  async function driverAction(text: string, interactiveId: string) {
    setBusy(true);
    try {
      if (!dispatchWaId && lastOrderId) {
        await refreshDispatch();
      }
      await simulate({
        role: "driver",
        phone: driverPhone,
        text,
        interactiveId,
        contextId: dispatchWaId || undefined,
      });
      pushLog(`Repartidor: ${text}`);
      await refreshDispatch();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-2xl"
          style={{ fontFamily: "var(--font-brand), sans-serif" }}
        >
          Demo WhatsApp
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Simula el webhook de Meta sin credenciales. Ideal para la reunión de
          venta. Cuando tengas el token de tu WhatsApp de prueba, cargalo en
          Conexión / <code>.env.local</code> — hasta entonces esto no te bloquea.
        </p>
      </div>

      <div className="panel p-4 grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-sm">Teléfono cliente demo</label>
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Teléfono repartidor</label>
          <Input
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={runFullDemo} disabled={busy}>
            {busy ? "Corriendo…" : "Correr demo completa"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={busy || !dispatchWaId}
          onClick={() => driverAction("estoy llegando", "action:arriving")}
        >
          Estoy llegando
        </Button>
        <Button
          variant="secondary"
          disabled={busy || !dispatchWaId}
          onClick={() => driverAction("estoy afuera", "action:outside")}
        >
          Estoy afuera
        </Button>
        <Button
          variant="secondary"
          disabled={busy || !dispatchWaId}
          onClick={() => driverAction("no estaba", "action:not_home")}
        >
          No estaba
        </Button>
        <Button
          variant="secondary"
          disabled={busy || !dispatchWaId}
          onClick={() => driverAction("entregado", "action:delivered")}
        >
          Entregado
        </Button>
        {lastOrderId ? (
          <Link
            href={`/pedidos/${lastOrderId}`}
            className="inline-flex items-center text-sm text-[var(--accent)] underline px-2"
          >
            Ver {orderCode(lastOrderId)}
          </Link>
        ) : null}
      </div>

      <div className="panel p-4">
        <h3 className="font-semibold mb-3">Log</h3>
        {log.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Todavía no corriste la demo.
          </p>
        ) : (
          <ul className="space-y-2">
            {log.map((item, idx) => (
              <li key={`${item.at}-${idx}`} className="text-sm">
                <span className="text-[var(--muted)] mr-2">{item.at}</span>
                <span className="font-medium">{item.title}</span>
                {item.detail ? (
                  <span className="text-[var(--muted)]"> — {item.detail}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}