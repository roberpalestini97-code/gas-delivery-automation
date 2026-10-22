export type InboundWhatsAppMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  button?: { text: string; payload?: string };
  context?: { id: string; from?: string };
};

export type WhatsAppWebhookPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: InboundWhatsAppMessage[];
        statuses?: unknown[];
      };
    }>;
  }>;
};

export type OutboundResult = {
  ok: boolean;
  messageId: string;
  demo: boolean;
  raw?: unknown;
  error?: string;
};