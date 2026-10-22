import { config, whatsappConfigured } from "@/lib/config";
import type { OutboundResult } from "./types";

function apiUrl(path: string) {
  return `https://graph.facebook.com/${config.whatsapp.apiVersion}/${path}`;
}

async function sendPayload(payload: Record<string, unknown>): Promise<OutboundResult> {
  if (!whatsappConfigured()) {
    const fakeId = `demo_out_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return { ok: true, messageId: fakeId, demo: true, raw: payload };
  }

  try {
    const res = await fetch(
      apiUrl(`${config.whatsapp.phoneNumberId}/messages`),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          ...payload,
        }),
      },
    );
    const raw = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        messageId: "",
        demo: false,
        raw,
        error: JSON.stringify(raw),
      };
    }
    const messageId =
      (raw as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id || "";
    return { ok: true, messageId, demo: false, raw };
  } catch (error) {
    return {
      ok: false,
      messageId: "",
      demo: false,
      error: error instanceof Error ? error.message : "send_failed",
    };
  }
}

export async function sendText(to: string, body: string, replyToId?: string) {
  return sendPayload({
    to,
    type: "text",
    text: { preview_url: false, body },
    ...(replyToId ? { context: { message_id: replyToId } } : {}),
  });
}

export async function sendButtons(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>,
) {
  return sendPayload({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

export async function sendList(
  to: string,
  body: string,
  buttonLabel: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
) {
  return sendPayload({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: sections.map((s) => ({
          title: s.title.slice(0, 24),
          rows: s.rows.map((r) => ({
            id: r.id,
            title: r.title.slice(0, 24),
            ...(r.description
              ? { description: r.description.slice(0, 72) }
              : {}),
          })),
        })),
      },
    },
  });
}