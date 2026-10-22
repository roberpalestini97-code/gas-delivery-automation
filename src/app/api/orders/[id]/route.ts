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
  if (!order) {
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