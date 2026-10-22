"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Conversation = {
  id: number;
  role: string;
  phone: string;
  state: string;
  humanTakeover: boolean;
  updatedAt: string;
};

export default function ConversacionesPage() {
  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setRows(d.conversations || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2
          className="text-2xl"
          style={{ fontFamily: "var(--font-brand), serif" }}
        >
          Conversaciones
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Chats del bot con clientes y repartidores.
        </p>
      </div>
      <div className="panel table-wrap">
        {loading ? (
          <p className="p-6 text-[var(--muted)]">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-[var(--muted)]">Sin conversaciones todavía.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Rol</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link
                      href={`/conversaciones/${c.id}`}
                      className="text-[var(--accent)] font-semibold"
                    >
                      #{c.id}
                    </Link>
                  </td>
                  <td>
                    <Badge tone={c.role === "driver" ? "accent" : "default"}>
                      {c.role === "driver" ? "Repartidor" : "Cliente"}
                    </Badge>
                  </td>
                  <td>{c.phone}</td>
                  <td>
                    {c.state}
                    {c.humanTakeover ? (
                      <Badge tone="warn" className="ml-2">
                        humano
                      </Badge>
                    ) : null}
                  </td>
                  <td className="text-xs text-[var(--muted)]">
                    {c.updatedAt.replace("T", " ").slice(0, 19)}
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