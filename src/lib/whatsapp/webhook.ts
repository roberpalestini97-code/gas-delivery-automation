import type {
  InboundWhatsAppMessage,
  WhatsAppWebhookPayload,
} from "./types";

export type NormalizedInbound = {
  from: string;
  waMessageId: string;
  contactName?: string;
  text: string;
  interactiveId?: string;
  contextId?: string;
  raw: InboundWhatsAppMessage;
};

export function extractInboundMessages(
  payload: WhatsAppWebhookPayload,
): NormalizedInbound[] {
  const results: NormalizedInbound[] = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value?.messages?.length) continue;
      const contactName = value.contacts?.[0]?.profile?.name;
      for (const message of value.messages) {
        results.push(normalizeMessage(message, contactName));
      }
    }
  }
  return results;
}

export function normalizeMessage(
  message: InboundWhatsAppMessage,
  contactName?: string,
): NormalizedInbound {
  let text = "";
  let interactiveId: string | undefined;

  if (message.type === "text") {
    text = message.text?.body?.trim() || "";
  } else if (message.type === "interactive") {
    if (message.interactive?.button_reply) {
      interactiveId = message.interactive.button_reply.id;
      text = message.interactive.button_reply.title;
    } else if (message.interactive?.list_reply) {
      interactiveId = message.interactive.list_reply.id;
      text = message.interactive.list_reply.title;
    }
  } else if (message.type === "button") {
    interactiveId = message.button?.payload;
    text = message.button?.text || "";
  }

  return {
    from: message.from,
    waMessageId: message.id,
    contactName,
    text: text.trim(),
    interactiveId,
    contextId: message.context?.id,
    raw: message,
  };
}

export function verifyWebhookChallenge(params: {
  mode: string | null;
  token: string | null;
  challenge: string | null;
  verifyToken: string;
}) {
  if (
    params.mode === "subscribe" &&
    params.token === params.verifyToken &&
    params.challenge
  ) {
    return params.challenge;
  }
  return null;
}