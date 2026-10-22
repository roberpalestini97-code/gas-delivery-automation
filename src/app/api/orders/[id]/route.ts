import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  customers,
  drivers,
  messages,
  orderDispatchMessages,
  orderEvents,
  orders,
  products,
  conversations,
} from "@/lib/db/schema";
import { formatPhone } from "@/lib/utils";
import { paymentStatusFromMethod } from "@/lib/labels";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const orderId = Number(id);
  const db = getDb();

  const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order || order.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customer = db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .get();
  const driver = order.driverId
    ? db.select().from(drivers).where(eq(drivers.id, order.driverId)).get()
    : null;
  const product = db
    .select()
    .from(products)
    .where(eq(products.id, order.productId))
    .get();
  const events = db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, orderId))
    .orderBy(asc(orderEvents.id))
    .all();
  const dispatches = db
    .select()
    .from(orderDispatchMessages)
    .where(eq(orderDispatchMessages.orderId, orderId))
    .all();

  let conversationMessages: Array<{
    id: number;
    direction: string;
    body: string;
    createdAt: string;
  }> = [];
  if (order.conversationId) {
    conversationMessages = db
      .select({
        id: messages.id,
        direction: messages.direction,
        body: messages.body,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, order.conversationId))
      .orderBy(asc(messages.id))
      .all();
  }

  const conv = order.conversationId
    ? db
        .select()
        .from(conversations)
        .where(eq(conversations.id, order.conversationId))
        .get()
    : null;

  return NextResponse.json({
    order,
    customer,
    driver,
    product,
    events,
    dispatches,
    conversation: conv,
    messages: conversationMessages,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const orderId = Number(id);
  const db = getDb();
  const existing = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    action?: "finalize" | "restore";
    customerName?: string;
    customerPhone?: string;
    address?: string;
    zone?: string | null;
    productId?: number;
    quantity?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    deliveryStatus?: string;
    driverId?: number | null;
    notes?: string | null;
  };

  const now = new Date().toISOString();

  if (body.action === "finalize") {
    const paymentStatus =
      existing.paymentStatus === "pending"
        ? paymentStatusFromMethod(existing.paymentMethod)
        : existing.paymentStatus;
    const order = db
      .update(orders)
      .set({
        deliveryStatus: "delivered",
        paymentStatus,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId))
      .returning()
      .get();

    db.insert(orderEvents)
      .values({
        orderId,
        actor: "admin",
        actionCode: "finalized",
        summary: "Pedido finalizado desde el back office",
        payloadJson: JSON.stringify({ paymentStatus }),
      })
      .run();

    return NextResponse.json({ order });
  }

  const patch: Record<string, unknown> = { updatedAt: now };
  if (body.address !== undefined) patch.address = body.address.trim();
  if (body.zone !== undefined) patch.zone = body.zone;
  if (body.productId !== undefined) patch.productId = Number(body.productId);
  if (body.quantity !== undefined)
    patch.quantity = Math.max(1, Number(body.quantity) || 1);
  if (body.paymentMethod !== undefined) patch.paymentMethod = body.paymentMethod;
  if (body.paymentStatus !== undefined) patch.paymentStatus = body.paymentStatus;
  if (body.deliveryStatus !== undefined)
    patch.deliveryStatus = body.deliveryStatus;
  if (body.driverId !== undefined)
    patch.driverId = body.driverId ? Number(body.driverId) : null;
  if (body.notes !== undefined) patch.notes = body.notes;

  if (body.customerPhone || body.customerName) {
    const customer = db
      .select()
      .from(customers)
      .where(eq(customers.id, existing.customerId))
      .get();
    if (customer) {
      db.update(customers)
        .set({
          phone: body.customerPhone
            ? formatPhone(body.customerPhone)
            : customer.phone,
          name:
            body.customerName !== undefined
              ? body.customerName
              : customer.name,
          lastAddress: body.address || customer.lastAddress,
          updatedAt: now,
        })
        .where(eq(customers.id, customer.id))
        .run();
    }
  }

  const order = db
    .update(orders)
    .set(patch)
    .where(eq(orders.id, orderId))
    .returning()
    .get();

  db.insert(orderEvents)
    .values({
      orderId,
      actor: "admin",
      actionCode: "updated",
      summary: "Pedido editado desde el back office",
      payloadJson: JSON.stringify(body),
    })
    .run();

  return NextResponse.json({ order });
}

/** Soft delete */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const orderId = Number(id);
  const db = getDb();
  const existing = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const order = db
    .update(orders)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(orders.id, orderId))
    .returning()
    .get();

  db.insert(orderEvents)
    .values({
      orderId,
      actor: "admin",
      actionCode: "soft_deleted",
      summary: "Pedido eliminado (borrado lógico)",
      payloadJson: "{}",
    })
    .run();

  return NextResponse.json({ ok: true, order });
}