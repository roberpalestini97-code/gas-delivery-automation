import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const conversation = getDb()
    .select()
    .from(conversations)
    .where(eq(conversations.id, Number(id)))
    .get();
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const msgs = getDb()
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(asc(messages.id))
    .all();
  return NextResponse.json({ conversation, messages: msgs });
}