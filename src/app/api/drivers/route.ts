import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { drivers } from "@/lib/db/schema";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ drivers: getDb().select().from(drivers).all() });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    name: string;
    phone: string;
    zones?: string[];
  };
  const driver = getDb()
    .insert(drivers)
    .values({
      name: body.name,
      phone: body.phone.replace(/\D/g, ""),
      zones: JSON.stringify(body.zones || []),
      active: true,
    })
    .returning()
    .get();
  return NextResponse.json({ driver });
}