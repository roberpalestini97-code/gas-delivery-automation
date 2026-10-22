import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ products: getDb().select().from(products).all() });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    code: string;
    name: string;
    unitLabel?: string;
    price?: number;
  };
  const product = getDb()
    .insert(products)
    .values({
      code: body.code,
      name: body.name,
      unitLabel: body.unitLabel || "u",
      price: body.price ?? null,
      active: true,
    })
    .returning()
    .get();
  return NextResponse.json({ product });
}