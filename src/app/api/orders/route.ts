import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  customers,
  drivers,
  orders,
  products,
} from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const db = getDb();
  const rows = db
    .select({
      order: orders,
      customer: customers,
      driver: drivers,
      product: products,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(drivers, eq(orders.driverId, drivers.id))
    .leftJoin(products, eq(orders.productId, products.id))
    .orderBy(desc(orders.id))
    .all();

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