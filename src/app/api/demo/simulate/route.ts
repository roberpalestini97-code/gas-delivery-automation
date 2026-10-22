import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { routeInbound } from "@/lib/agent/router";
import { getDb } from "@/lib/db";
import { drivers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { InboundWhatsAppMessage } from "@/lib/whatsapp/types";
import { normalizeMessage } from "@/lib/whatsapp/webhook";

export const runtime = "nodejs";

/**
 * Simulates WhatsApp webhooks without Meta credentials.
 * Body: { role: "customer"|"driver", phone?, text?, interactiveId?, contextId?, contactName? }
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    role?: "customer" | "driver";
    phone?: string;
    text?: string;
    interactiveId?: string;
    contextId?: string;
    contactName?: string;
  };

  let phone = body.phone;
  if (body.role === "driver") {
    const driver = getDb()
      .select()
      .from(drivers)
      .where(eq(drivers.active, true))
      .all()[0];
    phone = phone || driver?.phone;
  }
  phone = phone || "5491199990001";

  const waMessage: InboundWhatsAppMessage = {
    from: phone,
    id: `demo_in_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: String(Math.floor(Date.now() / 1000)),
    type: body.interactiveId ? "interactive" : "text",
    text: body.interactiveId ? undefined : { body: body.text || "" },
    interactive: body.interactiveId
      ? {
          type: "button_reply",
          button_reply: {
            id: body.interactiveId,
            title: body.text || body.interactiveId,
          },
        }
      : undefined,
    context: body.contextId ? { id: body.contextId } : undefined,
  };

  const inbound = normalizeMessage(waMessage, body.contactName || "Demo");
  if (body.interactiveId && body.text) {
    inbound.text = body.text;
  }

  const result = await routeInbound(inbound);
  return NextResponse.json({ ok: true, inbound, result });
}