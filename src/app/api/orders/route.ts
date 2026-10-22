import { NextRequest, NextResponse } from "next/server";
import { desc, eq, isNull } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  customers,
  drivers,
  orderEvents,
  orders,
  products,
} from "@/lib/db/schema";
import { formatPhone } from "@/lib/utils";

function upsertCustomer(params: {
  phone: string;
  name?: string | null;
  address?: string | null;
}) {
  const db = getDb();
  const phone = formatPhone(params.phone);
  const existing = db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .get();
  if (existing) {
    db.update(customers)
      .set({
        name: params.name || existing.name,
        lastAddress: params.address || existing.lastAddress,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customers.id, existing.id))
      .run();
    return existing.id;
  }
  return db
    .insert(customers)
    .values({
      phone,
      name: params.name || null,
      lastAddress: params.address || null,
    })
    .returning()
    .get().id;
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const includeDeleted =
    request.nextUrl.searchParams.get("includeDeleted") === "1";
  const db = getDb();
  const base = db
    .select({
      order: orders,
      customer: customers,
      driver: drivers,
      product: products,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(drivers, eq(orders.driverId, drivers.id))
    .leftJoin(products, eq(orders.productId, products.id));

  const rows = (
    includeDeleted
      ? base.orderBy(desc(orders.id))
      : base.where(isNull(orders.deletedAt)).orderBy(desc(orders.id))
  ).all();

  const filtered = status
    ? rows.filter((r) => r.order.deliveryStatus === status)
    : rows;

  return NextResponse.json({
    orders: filtered.map((r) => ({
      ...r.order,
      customer: r.customer,
      driver: r.driver,
      product: r.product,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    customerName?: string;
    customerPhone: string;
    address: string;
    zone?: string;
    productId: number;
    quantity?: number;
    paymentMethod: string;
    paymentStatus?: string;
    deliveryStatus?: string;
    driverId?: number | null;
    notes?: string;
  };

  if (!body.customerPhone || !body.address || !body.productId || !body.paymentMethod) {
    return NextResponse.json(
      { error: "Faltan teléfono, dirección, producto o forma de pago" },
      { status: 400 },
    );
  }

  const db = getDb();
  const product = db
    .select()
    .from(products)
    .where(eq(products.id, Number(body.productId)))
    .get();
  if (!product) {
    return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
  }

  const customerId = upsertCustomer({
    phone: body.customerPhone,
    name: body.customerName,
    address: body.address,
  });

  const order = db
    .insert(orders)
    .values({
      customerId,
      driverId: body.driverId ? Number(body.driverId) : null,
      address: body.address.trim(),
      zone: body.zone || null,
      productId: Number(body.productId),
      quantity: Math.max(1, Number(body.quantity) || 1),
      paymentMethod: body.paymentMethod,
      paymentStatus: body.paymentStatus || "pending",
      deliveryStatus: body.deliveryStatus || "confirmed",
      notes: body.notes || null,
    })
    .returning()
    .get();

  db.insert(orderEvents)
    .values({
      orderId: order.id,
      actor: "admin",
      actionCode: "created_manual",
      summary: "Pedido dado de alta desde el back office",
      payloadJson: JSON.stringify(body),
    })
    .run();

  return NextResponse.json({ order });
}