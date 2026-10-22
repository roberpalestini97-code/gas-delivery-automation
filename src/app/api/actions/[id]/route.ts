import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { driverActions } from "@/lib/db/schema";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as Partial<{
    label: string;
    aliases: string[];
    notifyCustomer: boolean;
    customerTemplate: string;
    deliveryStatus: string | null;
    paymentStatus: string | null;
    needsExtra: string | null;
    sortOrder: number;
    active: boolean;
  }>;

  const patch: Record<string, unknown> = {};
  if (body.label !== undefined) patch.label = body.label;
  if (body.aliases !== undefined) patch.aliasesJson = JSON.stringify(body.aliases);
  if (body.notifyCustomer !== undefined) patch.notifyCustomer = body.notifyCustomer;
  if (body.customerTemplate !== undefined)
    patch.customerTemplate = body.customerTemplate;
  if (body.deliveryStatus !== undefined) patch.deliveryStatus = body.deliveryStatus;
  if (body.paymentStatus !== undefined) patch.paymentStatus = body.paymentStatus;
  if (body.needsExtra !== undefined) patch.needsExtra = body.needsExtra;
  if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;
  if (body.active !== undefined) patch.active = body.active;

  const action = getDb()
    .update(driverActions)
    .set(patch)
    .where(eq(driverActions.id, Number(id)))
    .returning()
    .get();

  return NextResponse.json({ action });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  getDb()
    .update(driverActions)
    .set({ active: false })
    .where(eq(driverActions.id, Number(id)))
    .run();
  return NextResponse.json({ ok: true });
}