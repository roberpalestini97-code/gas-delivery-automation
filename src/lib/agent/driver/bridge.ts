import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditEvents,
  conversations,
  customers,
  driverActions,
  drivers,
  messages,
  orderDispatchMessages,
  orderEvents,
  orders,
  products,
} from "@/lib/db/schema";
import { orderCode, parseOrderCode } from "@/lib/utils";
import { sendList, sendText } from "@/lib/whatsapp/client";
import type { NormalizedInbound } from "@/lib/whatsapp/webhook";
import { matchDriverAction } from "./match";

function getOrCreateDriverConversation(phone: string, driverId: number) {
  const db = getDb();
  const existing = db
    .select()
    .from(conversations)
    .where(and(eq(conversations.phone, phone), eq(conversations.role, "driver")))
    .orderBy(desc(conversations.id))
    .get();
  if (existing) return existing;
  return db
    .insert(conversations)
    .values({
      role: "driver",
      phone,
      driverId,
      state: "ready",
      draftJson: "{}",
    })
    .returning()
    .get();
}

function resolveOrderId(params: {
  contextId?: string;
  explicitOrderId?: number | null;
  driverId: number;
}) {
  const db = getDb();
  if (params.contextId) {
    const dispatch = db
      .select()
      .from(orderDispatchMessages)
      .where(eq(orderDispatchMessages.waMessageId, params.contextId))
      .get();
    if (dispatch) return dispatch.orderId;
  }
  if (params.explicitOrderId) return params.explicitOrderId;

  // Pending draft asking for minutes/note on last order
  return null;
}

function renderTemplate(
  template: string,
  vars: { minutes?: number; note?: string; code?: string; address?: string },
) {
  return template
    .replace(/\{\{minutes\}\}/g, String(vars.minutes ?? "?"))
    .replace(/\{\{note\}\}/g, vars.note || "")
    .replace(/\{\{code\}\}/g, vars.code || "")
    .replace(/\{\{address\}\}/g, vars.address || "");
}

async function askPendingExtra(params: {
  phone: string;
  conversationId: number;
  orderId: number;
  actionCode: string;
  needsExtra: string;
}) {
  const draft = {
    pendingAction: params.actionCode,
    pendingOrderId: params.orderId,
    needsExtra: params.needsExtra,
  };
  getDb()
    .update(conversations)
    .set({
      state: "await_extra",
      draftJson: JSON.stringify(draft),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(conversations.id, params.conversationId))
    .run();

  if (params.needsExtra === "minutes") {
    await sendText(
      params.phone,
      `¿En cuántos minutos llegás al pedido ${orderCode(params.orderId)}? Respondé con un número (ej. 5).`,
    );
  } else {
    await sendText(
      params.phone,
      `Escribí la nota para el cliente de ${orderCode(params.orderId)}.`,
    );
  }
}

export async function applyDriverAction(params: {
  orderId: number;
  driverId: number;
  actionCode: string;
  minutes?: number;
  note?: string;
  waMessageInId?: string;
}) {
  const db = getDb();
  const action = db
    .select()
    .from(driverActions)
    .where(eq(driverActions.code, params.actionCode))
    .get();
  if (!action) {
    return { ok: false as const, error: "Acción no encontrada" };
  }

  const order = db.select().from(orders).where(eq(orders.id, params.orderId)).get();
  if (!order) return { ok: false as const, error: "Pedido no encontrado" };

  const customer = db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .get();
  if (!customer) return { ok: false as const, error: "Cliente no encontrado" };

  const patch: {
    deliveryStatus?: string;
    paymentStatus?: string;
    updatedAt: string;
  } = { updatedAt: new Date().toISOString() };
  if (action.deliveryStatus) patch.deliveryStatus = action.deliveryStatus;
  if (action.paymentStatus) patch.paymentStatus = action.paymentStatus;

  db.update(orders).set(patch).where(eq(orders.id, order.id)).run();

  let customerMessageId: string | undefined;
  let customerBody: string | undefined;

  if (action.notifyCustomer && action.customerTemplate) {
    customerBody = renderTemplate(action.customerTemplate, {
      minutes: params.minutes,
      note: params.note,
      code: orderCode(order.id),
      address: order.address,
    });
    const sent = await sendText(customer.phone, customerBody);
    customerMessageId = sent.messageId;
  }

  db.insert(orderEvents)
    .values({
      orderId: order.id,
      actor: "driver",
      actionCode: action.code,
      summary: `${action.label}${params.minutes ? ` (${params.minutes} min)` : ""}${params.note ? `: ${params.note}` : ""}`,
      payloadJson: JSON.stringify({
        minutes: params.minutes,
        note: params.note,
        customerNotified: Boolean(customerBody),
      }),
      waMessageInId: params.waMessageInId || null,
      waMessageOutId: customerMessageId || null,
    })
    .run();

  db.insert(auditEvents)
    .values({
      kind: "driver_action",
      summary: `${action.code} on ${orderCode(order.id)}`,
      payloadJson: JSON.stringify({
        orderId: order.id,
        action: action.code,
      }),
    })
    .run();

  return {
    ok: true as const,
    action,
    order,
    customer,
    customerBody,
    customerMessageId,
  };
}

export async function handleDriverMessage(inbound: NormalizedInbound) {
  const db = getDb();
  const driver = db
    .select()
    .from(drivers)
    .where(eq(drivers.phone, inbound.from))
    .get();

  if (!driver) {
    return { handled: false as const, reason: "not_a_driver" };
  }

  const conversation = getOrCreateDriverConversation(inbound.from, driver.id);

  db.insert(messages)
    .values({
      conversationId: conversation.id,
      direction: "inbound",
      waMessageId: inbound.waMessageId,
      body: inbound.text || inbound.interactiveId || "(vacío)",
      rawJson: JSON.stringify(inbound.raw),
    })
    .run();

  // Pending extra data (minutes / note)
  if (conversation.state === "await_extra") {
    let draft: {
      pendingAction?: string;
      pendingOrderId?: number;
      needsExtra?: string;
    } = {};
    try {
      draft = JSON.parse(conversation.draftJson);
    } catch {
      draft = {};
    }
    if (draft.pendingAction && draft.pendingOrderId) {
      const minutes =
        draft.needsExtra === "minutes"
          ? Number(inbound.text.replace(/\D/g, "")) || undefined
          : undefined;
      const note = draft.needsExtra === "note" ? inbound.text : undefined;
      if (draft.needsExtra === "minutes" && !minutes) {
        await sendText(inbound.from, "Necesito un número de minutos (ej. 5).");
        return { handled: true as const };
      }
      const result = await applyDriverAction({
        orderId: draft.pendingOrderId,
        driverId: driver.id,
        actionCode: draft.pendingAction,
        minutes,
        note,
        waMessageInId: inbound.waMessageId,
      });
      db.update(conversations)
        .set({
          state: "ready",
          draftJson: "{}",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(conversations.id, conversation.id))
        .run();

      if (!result.ok) {
        await sendText(inbound.from, result.error);
        return { handled: true as const };
      }
      await sendText(
        inbound.from,
        result.customerBody
          ? `Listo, avisamos al cliente de ${orderCode(result.order.id)}.`
          : `Listo, actualizamos ${orderCode(result.order.id)} (${result.action.label}).`,
      );
      return { handled: true as const };
    }
  }

  const actions = db
    .select()
    .from(driverActions)
    .where(eq(driverActions.active, true))
    .all();

  const matched = matchDriverAction(actions, {
    text: inbound.text,
    interactiveId: inbound.interactiveId,
  });

  const explicitOrderId =
    matched?.orderId || parseOrderCode(inbound.text) || null;
  const orderId = resolveOrderId({
    contextId: inbound.contextId,
    explicitOrderId,
    driverId: driver.id,
  });

  if (!matched) {
    if (!orderId && !inbound.contextId) {
      await sendText(
        inbound.from,
        "No encontré el pedido. Respondé al mensaje del pedido o poné el código #G-xxxx y la acción (ej. «#G-12 estoy llegando»).",
      );
      return { handled: true as const };
    }
    // Has order context but unknown action → show list
    if (orderId) {
      await sendList(inbound.from, `Acciones para ${orderCode(orderId)}`, "Elegir", [
        {
          title: "Estado",
          rows: actions
            .filter((a) => a.needsExtra !== "note")
            .slice(0, 8)
            .map((a) => ({
              id: `action:${a.code}`,
              title: a.label.slice(0, 24),
            })),
        },
      ]);
      // stash order in draft for next interactive without reply context
      db.update(conversations)
        .set({
          draftJson: JSON.stringify({ stickyOrderId: orderId }),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(conversations.id, conversation.id))
        .run();
      return { handled: true as const };
    }
    await sendText(
      inbound.from,
      "No entendí la acción. Probá «estoy llegando», «estoy afuera», «entregado» o usá los botones del pedido.",
    );
    return { handled: true as const };
  }

  let resolvedOrderId = orderId;
  if (!resolvedOrderId) {
    try {
      const sticky = JSON.parse(conversation.draftJson) as {
        stickyOrderId?: number;
      };
      resolvedOrderId = sticky.stickyOrderId || null;
    } catch {
      resolvedOrderId = null;
    }
  }

  if (!resolvedOrderId) {
    await sendText(
      inbound.from,
      `Entendí «${matched.action.label}», pero no sé a qué pedido. Respondé al mensaje del pedido o agregá el código #G-xxxx.`,
    );
    return { handled: true as const };
  }

  // Verify order belongs to this driver (or allow any active for demo flexibility)
  const order = db.select().from(orders).where(eq(orders.id, resolvedOrderId)).get();
  if (!order) {
    await sendText(inbound.from, `No existe el pedido ${orderCode(resolvedOrderId)}.`);
    return { handled: true as const };
  }

  if (
    matched.action.needsExtra === "minutes" &&
    matched.minutes == null
  ) {
    await askPendingExtra({
      phone: inbound.from,
      conversationId: conversation.id,
      orderId: resolvedOrderId,
      actionCode: matched.action.code,
      needsExtra: "minutes",
    });
    return { handled: true as const };
  }

  if (matched.action.needsExtra === "note" && !matched.note) {
    await askPendingExtra({
      phone: inbound.from,
      conversationId: conversation.id,
      orderId: resolvedOrderId,
      actionCode: matched.action.code,
      needsExtra: "note",
    });
    return { handled: true as const };
  }

  const result = await applyDriverAction({
    orderId: resolvedOrderId,
    driverId: driver.id,
    actionCode: matched.action.code,
    minutes: matched.minutes,
    note: matched.note,
    waMessageInId: inbound.waMessageId,
  });

  if (!result.ok) {
    await sendText(inbound.from, result.error);
    return { handled: true as const };
  }

  const product = db
    .select()
    .from(products)
    .where(eq(products.id, result.order.productId))
    .get();

  await sendText(
    inbound.from,
    result.customerBody
      ? `✅ ${result.action.label} → avisamos al cliente de ${orderCode(result.order.id)} (${product?.name || "pedido"}).`
      : `✅ ${result.action.label} registrado en ${orderCode(result.order.id)}.`,
  );

  return { handled: true as const, orderId: resolvedOrderId };
}

export function isDriverPhone(phone: string) {
  return Boolean(
    getDb().select().from(drivers).where(eq(drivers.phone, phone)).get(),
  );
}