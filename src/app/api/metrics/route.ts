import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  conversations,
  drivers,
  orderEvents,
  orders,
  products,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { labelPayment } from "@/lib/labels";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const allOrders = db
    .select()
    .from(orders)
    .all()
    .filter((o) => !o.deletedAt);
  const allProducts = db.select().from(products).all();
  const allDrivers = db.select().from(drivers).all();
  const allConversations = db.select().from(conversations).all();
  const arrivingEvents = db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.actionCode, "arriving"))
    .all();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);
  const todayKey = new Date().toISOString().slice(0, 10);

  const isDay = (iso: string, day: string) => iso.slice(0, 10) === day;

  const ordersYesterday = allOrders.filter((o) => isDay(o.createdAt, yKey));
  const ordersToday = allOrders.filter((o) => isDay(o.createdAt, todayKey));

  const garrafasSold = (list: typeof allOrders) =>
    list.reduce((sum, o) => {
      const product = allProducts.find((p) => p.id === o.productId);
      if (!product) return sum;
      if (product.code.startsWith("garrafa") || product.code.startsWith("tubo")) {
        return sum + o.quantity;
      }
      return sum;
    }, 0);

  const byDriver = allDrivers.map((d) => ({
    driverId: d.id,
    name: d.name,
    orders: allOrders.filter((o) => o.driverId === d.id).length,
    delivered: allOrders.filter(
      (o) => o.driverId === d.id && o.deliveryStatus === "delivered",
    ).length,
  }));

  const paymentKeys = [
    "pending",
    "paid_cash",
    "paid_transfer",
    "paid_prepaid",
    "unpaid",
    "failed",
  ] as const;

  const paymentBreakdown = paymentKeys.map((key) => ({
    key,
    label: labelPayment(key),
    count: allOrders.filter((o) => o.paymentStatus === key).length,
  }));

  return NextResponse.json({
    totals: {
      orders: allOrders.length,
      ordersToday: ordersToday.length,
      ordersYesterday: ordersYesterday.length,
      unitsYesterday: garrafasSold(ordersYesterday),
      unitsToday: garrafasSold(ordersToday),
      conversations: allConversations.length,
      customerConversations: allConversations.filter((c) => c.role === "customer")
        .length,
      notHome: allOrders.filter((o) => o.deliveryStatus === "not_home").length,
      delivered: allOrders.filter((o) => o.deliveryStatus === "delivered").length,
      arrivingEvents: arrivingEvents.length,
    },
    byDriver,
    paymentBreakdown,
  });
}