"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Product = {
  id: number;
  code: string;
  name: string;
  unitLabel: string;
  price: number | null;
  active: boolean;
};

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    price: "",
  });

  async function load() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        name: form.name,
        price: form.price ? Number(form.price) : undefined,
      }),
    });
    setForm({ code: "", name: "", price: "" });
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2
          className="text-2xl"
          style={{ fontFamily: "var(--font-brand), serif" }}
        >
          Productos
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Catálogo de garrafas y tubos que ofrece el bot.
        </p>
      </div>
      <form onSubmit={onSubmit} className="panel p-4 grid gap-3 md:grid-cols-4">
        <Input
          placeholder="código (garrafa_12)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          required
        />
        <Input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          placeholder="Precio"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <Button type="submit">Agregar</Button>
      </form>
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <code>{p.code}</code>
                </td>
                <td>{p.name}</td>
                <td>
                  {p.price != null
                    ? `$${p.price.toLocaleString("es-AR")}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}