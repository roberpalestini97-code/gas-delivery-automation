"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { DeliveryBadge, PaymentBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deliveryLabels,
  paymentLabels,
  paymentMethodLabels,
} from "@/lib/labels";
import { orderCode } from "@/lib/utils";

type OrderRow = {
  id: number;
  address: string;
  zone: string | null;
  quantity: number;
  deliveryStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  productId: number;
  driverId: number | null;
  notes: string | null;
  createdAt: string;
  customer: { phone: string; name: string | null } | null;
  driver: { id: number; name: string } | null;
  product: { id: number; name: string } | null;
};

type Product = { id: number; name: string; active: boolean };
type Driver = { id: number; name: string; active: boolean };

type FormState = {
  customerName: string;
  customerPhone: string;
  address: string;
  zone: string;
  productId: string;
  quantity: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStatus: string;
  driverId: string;
  notes: string;
};

const emptyForm: FormState = {
  customerName: "",
  customerPhone: "",
  address: "",
  zone: "",
  productId: "",
  quantity: "1",
  paymentMethod: "cash",
  paymentStatus: "pending",
  deliveryStatus: "confirmed",
  driverId: "",
  notes: "",
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const [ordersRes, productsRes, driversRes] = await Promise.all([
      fetch("/api/orders"),
      fetch("/api/products"),
      fetch("/api/drivers"),
    ]);
    const ordersData = await ordersRes.json();
    const productsData = await productsRes.json();
    const driversData = await driversRes.json();
    setOrders(ordersData.orders || []);
    setProducts((productsData.products || []).filter((p: Product) => p.active));
    setDrivers((driversData.drivers || []).filter((d: Driver) => d.active));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      productId: products[0] ? String(products[0].id) : "",
      driverId: drivers[0] ? String(drivers[0].id) : "",
    });
    setFormOpen(true);
    setMessage("");
  }

  function openEdit(order: OrderRow) {
    setEditingId(order.id);
    setForm({
      customerName: order.customer?.name || "",
      customerPhone: order.customer?.phone || "",
      address: order.address,
      zone: order.zone || "",
      productId: String(order.productId),
      quantity: String(order.quantity),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      driverId: order.driverId ? String(order.driverId) : "",
      notes: order.notes || "",
    });
    setFormOpen(true);
    setMessage("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      address: form.address,
      zone: form.zone || undefined,
      productId: Number(form.productId),
      quantity: Number(form.quantity),
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
      deliveryStatus: form.deliveryStatus,
      driverId: form.driverId ? Number(form.driverId) : null,
      notes: form.notes || undefined,
    };

    const res = await fetch(
      editingId ? `/api/orders/${editingId}` : "/api/orders",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "No se pudo guardar");
      return;
    }
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    await load();
  }

  async function softDelete(id: number) {
    if (!confirm(`¿Eliminar el pedido ${orderCode(id)}? (borrado lógico)`)) {
      return;
    }
    setBusyId(id);
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setBusyId(null);
    await load();
  }

  async function finalize(id: number) {
    if (!confirm(`¿Finalizar ${orderCode(id)}? Queda entregado y pagado según la forma de pago.`)) {
      return;
    }
    setBusyId(id);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finalize" }),
    });
    setBusyId(null);
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className="text-2xl"
            style={{ fontFamily: "var(--font-brand), serif" }}
          >
            Pedidos
          </h2>
          <p className="text-[var(--muted)] text-sm">
            ABM operativo: alta manual, editar, finalizar o eliminar (lógico).
          </p>
        </div>
        <Button onClick={openCreate}>Nuevo pedido</Button>
      </div>

      {formOpen ? (
        <form onSubmit={onSubmit} className="panel p-4 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold">
              {editingId ? `Editar ${orderCode(editingId)}` : "Alta de pedido"}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
            >
              Cerrar
            </Button>
          </div>
          <div>
            <label className="text-sm">Nombre cliente</label>
            <Input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="María Pérez"
            />
          </div>
          <div>
            <label className="text-sm">Teléfono WhatsApp</label>
            <Input
              value={form.customerPhone}
              onChange={(e) =>
                setForm({ ...form, customerPhone: e.target.value })
              }
              placeholder="54911..."
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm">Dirección</label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm">Zona</label>
            <Input
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              placeholder="centro / norte / sur"
            />
          </div>
          <div>
            <label className="text-sm">Producto</label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              required
            >
              <option value="">Elegir…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Cantidad</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm">Forma de pago</label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
            >
              {Object.entries(paymentMethodLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Estado de pago</label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              value={form.paymentStatus}
              onChange={(e) =>
                setForm({ ...form, paymentStatus: e.target.value })
              }
            >
              {Object.entries(paymentLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Estado de entrega</label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              value={form.deliveryStatus}
              onChange={(e) =>
                setForm({ ...form, deliveryStatus: e.target.value })
              }
            >
              {Object.entries(deliveryLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Repartidor</label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
            >
              <option value="">Sin asignar</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm">Notas</label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <Button disabled={saving}>
              {saving
                ? "Guardando…"
                : editingId
                  ? "Guardar cambios"
                  : "Crear pedido"}
            </Button>
            {message ? (
              <span className="text-sm text-red-700">{message}</span>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="panel table-wrap">
        {loading ? (
          <p className="p-6 text-[var(--muted)]">Cargando pedidos…</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-[var(--muted)]">
            Todavía no hay pedidos. Tocá <strong>Nuevo pedido</strong> para dar
            uno de alta.
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link
                      href={`/pedidos/${o.id}`}
                      className="font-semibold text-[var(--accent)]"
                    >
                      {orderCode(o.id)}
                    </Link>
                    <div className="text-[10px] text-[var(--muted)]">
                      {o.createdAt.replace("T", " ").slice(0, 16)}
                    </div>
                  </td>
                  <td>
                    <div>{o.customer?.name || "—"}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {o.customer?.phone}
                    </div>
                  </td>
                  <td>
                    <div>{o.address}</div>
                    {o.zone ? (
                      <div className="text-xs text-[var(--muted)]">
                        Zona {o.zone}
                      </div>
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
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === o.id}
                        onClick={() => openEdit(o)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={
                          busyId === o.id || o.deliveryStatus === "delivered"
                        }
                        onClick={() => finalize(o.id)}
                      >
                        Finalizar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busyId === o.id}
                        onClick={() => softDelete(o.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
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