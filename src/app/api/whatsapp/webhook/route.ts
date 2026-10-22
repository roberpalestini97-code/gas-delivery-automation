import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { routeInbound } from "@/lib/agent/router";
import {
  extractInboundMessages,
  verifyWebhookChallenge,
} from "@/lib/whatsapp/webhook";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const challenge = verifyWebhookChallenge({
    mode: request.nextUrl.searchParams.get("hub.mode"),
    token: request.nextUrl.searchParams.get("hub.verify_token"),
    challenge: request.nextUrl.searchParams.get("hub.challenge"),
    verifyToken: config.whatsapp.verifyToken,
  });
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  let payload: WhatsAppWebhookPayload;
  try {
    payload = (await request.json()) as WhatsAppWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = extractInboundMessages(payload);
  for (const message of messages) {
    try {
      await routeInbound(message);
    } catch (error) {
      console.error("routeInbound error", error);
    }
  }

  return NextResponse.json({ ok: true });
}