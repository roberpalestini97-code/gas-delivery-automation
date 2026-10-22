import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  customers,
  drivers,
  orderEvents,
  orders,
  products,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** Loads a handful of historical-looking orders for sales demos / metrics. */
export async function POST() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const productList = db.select().from(products).where(eq(products.active, true)).all();
  const driverList = db.select().from(drivers).where(eq(drivers.active, true)).all();
  if (!productList.length || !driverList.length) {
    return NextResponse.json(
      { error: "Faltan productos o repartidores seed" },
      { status: 400 },
    );
  }

  const samples = [
    {
      phone: "5491100001001",
      name: "Ana Pérez",
      address: "Directorio 2450, Flores",
      zone: "oeste",
      qty: 1,
      paymentMethod: "cash",
      paymentStatus: "paid_cash",
      deliveryStatus: "delivered",
      daysAgo: 1,
    },
    {
      phone: "5491100001002",
      name: "Jorge Ruiz",
      address: "Cabildo 3200, Belgrano",
      zone: "norte",
      qty: 2,
      paymentMethod: "transfer",
      paymentStatus: "paid_transfer",
      deliveryStatus: "delivered",
      daysAgo: 1,
    },
    {
      phone: "5491100001003",
      name: "Lucía Gómez",
      address: "Av. San Juan 1500",
      zone: "centro",
      qty: 1,
      paymentMethod: "cash",
      paymentStatus: "unpaid",
      deliveryStatus: "not_home",
      daysAgo: 0,
    },
    {
      phone: "5491100001004",
      name: "Martín Soto",
      address: "Rivadavia 8900, Liniers",
      zone: "oeste",
      qty: 3,
      paymentMethod: "prepaid",
      paymentStatus: "paid_prepaid",
      deliveryStatus: "arriving",
      daysAgo: 0,
    },
  ];

  const created: number[] = [];

  for (const sample of samples) {
    let customer = db
      .select()
      .from(customers)
      .where(eq(customers.phone, sample.phone))
      .get();
    if (!customer) {
      customer = db
        .insert(customers)
        .values({
          phone: sample.phone,
          name: sample.name,
          lastAddress: sample.address,
        })
        .returning()
        .get();
    }

    const driver =
      driverList.find((d) => {
        try {
          return (JSON.parse(d.zones) as string[]).includes(sample.zone);
        } catch {
          return false;
        }
      }) || driverList[0];

    const product = productList[created.length % productList.length];
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - sample.daysAgo);
    createdAt.setHours(10 + created.length, 15, 0, 0);

    const order = db
      .insert(orders)
      .values({
        customerId: customer.id,
        driverId: driver.id,
        address: sample.address,
        zone: sample.zone,
        productId: product.id,
        quantity: sample.qty,
        paymentMethod: sample.paymentMethod,
        paymentStatus: sample.paymentStatus,
        deliveryStatus: sample.deliveryStatus,
        createdAt: createdAt.toISOString().replace("T", " ").slice(0, 19),
        updatedAt: createdAt.toISOString().replace("T", " ").slice(0, 19),
      })
      .returning()
      .get();

    db.insert(orderEvents)
      .values([
        {
          orderId: order.id,
          actor: "system",
          actionCode: "confirmed",
          summary: "Pedido de ejemplo (seed demo)",
          createdAt: createdAt.toISOString().replace("T", " ").slice(0, 19),
        },
        {
          orderId: order.id,
          actor: "driver",
          actionCode:
            sample.deliveryStatus === "not_home"
              ? "not_home"
              : sample.deliveryStatus === "arriving"
                ? "arriving"
                : "delivered",
          summary: `Estado demo: ${sample.deliveryStatus}`,
          createdAt: createdAt.toISOString().replace("T", " ").slice(0, 19),
        },
      ])
      .run();

    created.push(order.id);
  }

  return NextResponse.json({ ok: true, createdOrderIds: created });
}