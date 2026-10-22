"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Driver = {
  id: number;
  name: string;
  phone: string;
  zones: string;
  active: boolean;
};

export default function RepartidoresPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zones, setZones] = useState("centro");

  async function load() {
    const res = await fetch("/api/drivers");
    const data = await res.json();
    setDrivers(data.drivers || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        zones: zones.split(",").map((z) => z.trim()).filter(Boolean),
      }),
    });
    setName("");
    setPhone("");
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2
          className="text-2xl"
          style={{ fontFamily: "var(--font-brand), sans-serif" }}
        >
          Repartidores
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Teléfonos WhatsApp que el bot reconoce como camión.
        </p>
      </div>
      <form onSubmit={onSubmit} className="panel p-4 grid gap-3 md:grid-cols-4">
        <Input
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          placeholder="Teléfono WA (549...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Input
          placeholder="Zonas (norte,centro)"
          value={zones}
          onChange={(e) => setZones(e.target.value)}
        />
        <Button type="submit">Agregar</Button>
      </form>
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Zonas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.phone}</td>
                <td className="text-xs">{d.zones}</td>
                <td>
                  <Badge tone={d.active ? "success" : "muted"}>
                    {d.active ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}