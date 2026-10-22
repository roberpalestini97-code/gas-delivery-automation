import { handleCustomerMessage } from "@/lib/agent/customer/fsm";
import {
  handleDriverMessage,
  isDriverPhone,
} from "@/lib/agent/driver/bridge";
import type { NormalizedInbound } from "@/lib/whatsapp/webhook";
import { getDb } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";

export async function routeInbound(inbound: NormalizedInbound) {
  getDb()
    .insert(auditEvents)
    .values({
      kind: "wa_inbound",
      summary: `Msg from ${inbound.from}`,
      payloadJson: JSON.stringify({
        text: inbound.text,
        interactiveId: inbound.interactiveId,
        contextId: inbound.contextId,
      }),
    })
    .run();

  if (isDriverPhone(inbound.from)) {
    return handleDriverMessage(inbound);
  }
  return handleCustomerMessage(inbound);
}