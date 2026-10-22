import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { conversations } from "@/lib/db/schema";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = getDb()
    .select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt))
    .all();
  return NextResponse.json({ conversations: rows });
}