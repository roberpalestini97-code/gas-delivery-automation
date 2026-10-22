import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { driverActions } from "@/lib/db/schema";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const actions = getDb()
    .select()
    .from(driverActions)
    .orderBy(asc(driverActions.sortOrder))
    .all();
  return NextResponse.json({ actions });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    code: string;
    label: string;
    aliases?: string[];
    notifyCustomer?: boolean;
    customerTemplate?: string;
    deliveryStatus?: string | null;
    paymentStatus?: string | null;
    needsExtra?: string | null;
    sortOrder?: number;
  };

  if (!body.code || !body.label) {
    return NextResponse.json(
      { error: "code y label son obligatorios" },
      { status: 400 },
    );
  }

  const action = getDb()
    .insert(driverActions)
    .values({
      code: body.code,
      label: body.label,
      aliasesJson: JSON.stringify(body.aliases || []),
      notifyCustomer: body.notifyCustomer ?? true,
      customerTemplate: body.customerTemplate || "",
      deliveryStatus: body.deliveryStatus || null,
      paymentStatus: body.paymentStatus || null,
      needsExtra: body.needsExtra || null,
      sortOrder: body.sortOrder ?? 200,
      active: true,
    })
    .returning()
    .get();

  return NextResponse.json({ action });
}