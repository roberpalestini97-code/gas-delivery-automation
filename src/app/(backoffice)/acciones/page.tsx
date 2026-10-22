"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Action = {
  id: number;
  code: string;
  label: string;
  aliasesJson: string;
  notifyCustomer: boolean;
  customerTemplate: string;
  deliveryStatus: string | null;
  paymentStatus: string | null;
  needsExtra: string | null;
  active: boolean;
  sortOrder: number;
};

export default function AccionesPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [form, setForm] = useState({
    code: "",
    label: "",
    aliases: "",
    customerTemplate: "",
    deliveryStatus: "",
    notifyCustomer: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/actions");
    const data = await res.json();
    setActions(data.actions || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        label: form.label,
        aliases: form.aliases
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        customerTemplate: form.customerTemplate,
        deliveryStatus: form.deliveryStatus || null,
        notifyCustomer: form.notifyCustomer,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("No se pudo crear (¿código duplicado?)");
      return;
    }
    setMessage("Acción creada. El repartidor ya puede usarla.");
    setForm({
      code: "",
      label: "",
      aliases: "",
      customerTemplate: "",
      deliveryStatus: "",
      notifyCustomer: true,
    });
    load();
  }

  async function toggleActive(action: Action) {
    await fetch(`/api/actions/${action.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !action.active }),
    });
    load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-2xl"
          style={{ fontFamily: "var(--font-brand), serif" }}
        >
          Acciones del repartidor
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Catálogo configurable: nuevas frases y avisos al cliente sin redeploy.
        </p>
      </div>

      <form onSubmit={onCreate} className="panel p-4 grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-sm">Código</label>
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="porteria"
            required
          />
        </div>
        <div>
          <label className="text-sm">Etiqueta</label>
          <Input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Dejo en portería"
            required
          />
        </div>
        <div>
          <label className="text-sm">Aliases (separados por coma)</label>
          <Input
            value={form.aliases}
            onChange={(e) => setForm({ ...form, aliases: e.target.value })}
            placeholder="porteria, dejo en porteria"
          />
        </div>
        <div>
          <label className="text-sm">Estado de entrega (opcional)</label>
          <Input
            value={form.deliveryStatus}
            onChange={(e) => setForm({ ...form, deliveryStatus: e.target.value })}
            placeholder="delivered"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm">Mensaje al cliente</label>
          <Input
            value={form.customerTemplate}
            onChange={(e) =>
              setForm({ ...form, customerTemplate: e.target.value })
            }
            placeholder="Dejamos la garrafa en portería. ¡Gracias!"
          />
        </div>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={form.notifyCustomer}
            onChange={(e) =>
              setForm({ ...form, notifyCustomer: e.target.checked })
            }
          />
          Notificar al cliente
        </label>
        <div className="md:col-span-2 flex items-center gap-3">
          <Button disabled={saving}>
            {saving ? "Guardando…" : "Agregar acción"}
          </Button>
          {message ? (
            <span className="text-sm text-emerald-800">{message}</span>
          ) : null}
        </div>
      </form>

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Código</th>
              <th>Etiqueta</th>
              <th>Aliases</th>
              <th>Aviso cliente</th>
              <th>Estados</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id} className={!a.active ? "opacity-50" : undefined}>
                <td>
                  <code>{a.code}</code>
                </td>
                <td>{a.label}</td>
                <td className="text-xs text-[var(--muted)] max-w-[220px]">
                  {(() => {
                    try {
                      return (JSON.parse(a.aliasesJson) as string[]).join(", ");
                    } catch {
                      return "";
                    }
                  })()}
                </td>
                <td className="text-xs max-w-[280px]">
                  {a.notifyCustomer ? a.customerTemplate : (
                    <Badge tone="muted">sin aviso</Badge>
                  )}
                </td>
                <td className="text-xs">
                  {a.deliveryStatus || "—"} / {a.paymentStatus || "—"}
                  {a.needsExtra ? ` · extra:${a.needsExtra}` : ""}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(a)}
                  >
                    {a.active ? "Desactivar" : "Activar"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}