import type Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { count } from "drizzle-orm";
import * as schema from "./schema";

type Db = BetterSQLite3Database<typeof schema>;

const DEFAULT_ACTIONS = [
  {
    code: "arriving",
    label: "Estoy llegando",
    aliasesJson: JSON.stringify([
      "estoy llegando",
      "llegando",
      "ya llego",
      "ya llego",
      "voy llegando",
    ]),
    notifyCustomer: true,
    customerTemplate:
      "🚚 El camión de El Barba Gas está llegando a tu dirección. ¡Salí cuando puedas!",
    deliveryStatus: "arriving",
    paymentStatus: null as string | null,
    needsExtra: null as string | null,
    sortOrder: 10,
  },
  {
    code: "eta",
    label: "Llego en N minutos",
    aliasesJson: JSON.stringify([
      "llego en",
      "llego en",
      "estoy a",
      "voy a llegar en",
      "en 5",
      "en cinco",
    ]),
    notifyCustomer: true,
    customerTemplate:
      "⏱ El repartidor de El Barba Gas llega en aproximadamente {{minutes}} minutos.",
    deliveryStatus: "en_route",
    paymentStatus: null,
    needsExtra: "minutes",
    sortOrder: 20,
  },
  {
    code: "outside",
    label: "Estoy afuera",
    aliasesJson: JSON.stringify(["estoy afuera", "afuera", "estoy fuera"]),
    notifyCustomer: true,
    customerTemplate:
      "🚪 El repartidor está afuera. Por favor acercate a retirar tu pedido.",
    deliveryStatus: "outside",
    paymentStatus: null,
    needsExtra: null,
    sortOrder: 30,
  },
  {
    code: "waiting",
    label: "Estoy esperando",
    aliasesJson: JSON.stringify(["estoy esperando", "esperando", "te espero"]),
    notifyCustomer: true,
    customerTemplate:
      "⏳ El repartidor te está esperando en la dirección del pedido.",
    deliveryStatus: "waiting",
    paymentStatus: null,
    needsExtra: null,
    sortOrder: 40,
  },
  {
    code: "not_home",
    label: "No estaba",
    aliasesJson: JSON.stringify([
      "no estaba",
      "no hay nadie",
      "nadie",
      "ausente",
    ]),
    notifyCustomer: true,
    customerTemplate:
      "😔 Pasamos por tu dirección y no había nadie. Escribinos para reprogramar la entrega.",
    deliveryStatus: "not_home",
    paymentStatus: null,
    needsExtra: null,
    sortOrder: 50,
  },
  {
    code: "delivered",
    label: "Entregado",
    aliasesJson: JSON.stringify(["entregado", "entregue", "listo entregado"]),
    notifyCustomer: true,
    customerTemplate:
      "✅ Pedido entregado. ¡Gracias por elegir El Barba Gas!",
    deliveryStatus: "delivered",
    paymentStatus: null,
    needsExtra: null,
    sortOrder: 60,
  },
  {
    code: "paid_cash",
    label: "Pagó efectivo",
    aliasesJson: JSON.stringify([
      "pago efectivo",
      "pagó efectivo",
      "efectivo",
      "pago en efectivo",
    ]),
    notifyCustomer: false,
    customerTemplate: "",
    deliveryStatus: "delivered",
    paymentStatus: "paid_cash",
    needsExtra: null,
    sortOrder: 70,
  },
  {
    code: "paid_transfer",
    label: "Pagó transferencia",
    aliasesJson: JSON.stringify([
      "pago transferencia",
      "pagó transferencia",
      "transferencia",
      "transfer",
    ]),
    notifyCustomer: false,
    customerTemplate: "",
    deliveryStatus: "delivered",
    paymentStatus: "paid_transfer",
    needsExtra: null,
    sortOrder: 80,
  },
  {
    code: "unpaid",
    label: "No pagó",
    aliasesJson: JSON.stringify(["no pago", "no pagó", "sin pagar", "impago"]),
    notifyCustomer: false,
    customerTemplate: "",
    deliveryStatus: null,
    paymentStatus: "unpaid",
    needsExtra: null,
    sortOrder: 90,
  },
  {
    code: "custom_note",
    label: "Nota al cliente",
    aliasesJson: JSON.stringify([]),
    notifyCustomer: true,
    customerTemplate: "📌 Mensaje del repartidor: {{note}}",
    deliveryStatus: null,
    paymentStatus: null,
    needsExtra: "note",
    sortOrder: 100,
  },
];

export function seedIfEmpty(db: Db, _sqlite?: Database.Database) {
  void _sqlite;
  const [{ value: productCount }] = db
    .select({ value: count() })
    .from(schema.products)
    .all();

  if (productCount > 0) return;

  db.insert(schema.products)
    .values([
      {
        code: "garrafa_10",
        name: "Garrafa 10 kg",
        unitLabel: "garrafa",
        price: 18000,
      },
      {
        code: "garrafa_15",
        name: "Garrafa 15 kg",
        unitLabel: "garrafa",
        price: 24000,
      },
      {
        code: "tubo_45",
        name: "Tubo 45 kg",
        unitLabel: "tubo",
        price: 65000,
      },
    ])
    .run();

  // Phones are placeholders until real WhatsApp numbers are wired in Repartidores
  db.insert(schema.drivers)
    .values([
      {
        name: "Camión 1 — Santa Clara / Centro",
        phone: "5491110000001",
        zones: JSON.stringify([
          "santa clara",
          "centro",
          "frente mar",
          "santa elena",
          "playa dorada",
        ]),
        active: true,
      },
      {
        name: "Camión 2 — Norte / Sur costa",
        phone: "5491110000002",
        zones: JSON.stringify([
          "camet norte",
          "mar de cobo",
          "la caleta",
          "parque lago",
          "mar chiquita",
          "atlantida",
        ]),
        active: true,
      },
    ])
    .run();

  db.insert(schema.driverActions).values(DEFAULT_ACTIONS).run();

  db.insert(schema.auditEvents)
    .values({
      kind: "seed",
      summary:
        "Seed El Barba Gas: garrafas 10/15 + tubo 45, zonas Santa Clara del Mar",
      payloadJson: JSON.stringify({
        local: "Av. Automóvil Club Argentino 862, Santa Clara del Mar",
        whatsappPublic: ["2235388647", "2234602686"],
        instagram: "@elbarbagas",
      }),
    })
    .run();
}