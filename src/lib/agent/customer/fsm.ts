import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditEvents,
  conversations,
  customers,
  drivers,
  messages,
  orderDispatchMessages,
  orderEvents,
  orders,
  products,
} from "@/lib/db/schema";
import { orderCode } from "@/lib/utils";
import { sendButtons, sendList, sendText } from "@/lib/whatsapp/client";
import type { NormalizedInbound } from "@/lib/whatsapp/webhook";
import { appendOrderToSheet } from "@/lib/sheets/client";

type Draft = {
  address?: string;
  productId?: number;
  quantity?: number;
  paymentMethod?: string;
  reuseAddress?: boolean;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo en el momento",
  transfer: "Transferencia",
  prepaid: "Ya pagué / prepago",
};

function parseDraft(json: string): Draft {
  try {
    return JSON.parse(json) as Draft;
  } catch {
    return {};
  }
}

async function reply(
  phone: string,
  conversationId: number,
  body: string,
  options?: {
    buttons?: Array<{ id: string; title: string }>;
    list?: {
      buttonLabel: string;
      sections: Array<{
        title: string;
        rows: Array<{ id: string; title: string; description?: string }>;
      }>;
    };
  },
) {
  let result;
  if (options?.list) {
    result = await sendList(
      phone,
      body,
      options.list.buttonLabel,
      options.list.sections,
    );
  } else if (options?.buttons) {
    result = await sendButtons(phone, body, options.buttons);
  } else {
    result = await sendText(phone, body);
  }

  getDb()
    .insert(messages)
    .values({
      conversationId,
      direction: "outbound",
      waMessageId: result.messageId || null,
      body,
      rawJson: JSON.stringify(result),
    })
    .run();

  return result;
}

function getOrCreateCustomer(phone: string, name?: string) {
  const db = getDb();
  const existing = db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .get();
  if (existing) {
    if (name && !existing.name) {
      db.update(customers)
        .set({ name, updatedAt: new Date().toISOString() })
        .where(eq(customers.id, existing.id))
        .run();
      return { ...existing, name };
    }
    return existing;
  }
  const inserted = db
    .insert(customers)
    .values({ phone, name: name || null })
    .returning()
    .get();
  return inserted;
}

function getOrCreateConversation(phone: string, customerId: number) {
  const db = getDb();
  const existing = db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.phone, phone), eq(conversations.role, "customer")),
    )
    .orderBy(desc(conversations.id))
    .get();

  if (existing && !["completed", "cancelled"].includes(existing.state)) {
    return existing;
  }

  return db
    .insert(conversations)
    .values({
      role: "customer",
      phone,
      customerId,
      state: "greeting",
      draftJson: "{}",
    })
    .returning()
    .get();
}

function updateConversation(
  id: number,
  patch: Partial<{
    state: string;
    draftJson: string;
    humanTakeover: boolean;
  }>,
) {
  getDb()
    .update(conversations)
    .set({ ...patch, updatedAt: new Date().toISOString() })
    .where(eq(conversations.id, id))
    .run();
}

function pickDriver(zone?: string | null) {
  const db = getDb();
  const all = db
    .select()
    .from(drivers)
    .where(eq(drivers.active, true))
    .all();
  if (!all.length) return null;
  if (zone) {
    const match = all.find((d) => {
      try {
        const zones = JSON.parse(d.zones) as string[];
        return zones.map((z) => z.toLowerCase()).includes(zone.toLowerCase());
      } catch {
        return false;
      }
    });
    if (match) return match;
  }
  return all[0];
}

function guessZone(address: string) {
  const lower = address.toLowerCase();
  if (/(norte|belgrano|nuñez|nunez|saavedra)/.test(lower)) return "norte";
  if (/(sur|avellaneda|lanus|lomas)/.test(lower)) return "sur";
  if (/(oeste|moron|ramos|haedo)/.test(lower)) return "oeste";
  return "centro";
}

async function dispatchOrder(orderId: number) {
  const db = getDb();
  const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order || !order.driverId) return;

  const customer = db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .get();
  const product = db
    .select()
    .from(products)
    .where(eq(products.id, order.productId))
    .get();
  const driver = db
    .select()
    .from(drivers)
    .where(eq(drivers.id, order.driverId))
    .get();
  if (!customer || !product || !driver) return;

  const code = orderCode(order.id);
  const payment =
    PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;
  const body = [
    `🧾 Pedido ${code}`,
    `Cliente: ${customer.name || "Sin nombre"} (${customer.phone})`,
    `Dirección: ${order.address}`,
    `Producto: ${order.quantity} × ${product.name}`,
    `Pago: ${payment}`,
    `Zona: ${order.zone || "-"}`,
    "",
    "Respondé a este mensaje o usá los botones. También podés escribir p.ej. «estoy llegando» o «#G-xx estoy afuera».",
  ].join("\n");

  const result = await sendButtons(driver.phone, body, [
    { id: "action:arriving", title: "Estoy llegando" },
    { id: "action:outside", title: "Estoy afuera" },
    { id: "action:delivered", title: "Entregado" },
  ]);

  db.insert(orderDispatchMessages)
    .values({
      orderId: order.id,
      driverId: driver.id,
      waMessageId: result.messageId || `local_dispatch_${order.id}`,
    })
    .run();

  db.update(orders)
    .set({
      deliveryStatus: "dispatched",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(orders.id, order.id))
    .run();

  db.insert(orderEvents)
    .values({
      orderId: order.id,
      actor: "system",
      actionCode: "dispatched",
      summary: `Despachado a ${driver.name}`,
      payloadJson: JSON.stringify({ waMessageId: result.messageId }),
      waMessageOutId: result.messageId || null,
    })
    .run();

  // Follow-up list with more actions
  await sendList(
    driver.phone,
    `Más acciones para ${code}`,
    "Acciones",
    [
      {
        title: "En camino",
        rows: [
          { id: "action:eta", title: "Llego en N min" },
          { id: "action:waiting", title: "Estoy esperando" },
          { id: "action:not_home", title: "No estaba" },
        ],
      },
      {
        title: "Pago",
        rows: [
          { id: "action:paid_cash", title: "Pagó efectivo" },
          { id: "action:paid_transfer", title: "Pagó transferencia" },
          { id: "action:unpaid", title: "No pagó" },
        ],
      },
    ],
  );

  return { driver, code };
}

async function confirmOrder(params: {
  conversationId: number;
  customerId: number;
  phone: string;
  draft: Draft;
}) {
  const db = getDb();
  const { conversationId, customerId, phone, draft } = params;
  if (!draft.address || !draft.productId || !draft.quantity || !draft.paymentMethod) {
    await reply(phone, conversationId, "Faltan datos del pedido. Empecemos de nuevo. ¿Cuál es la dirección de entrega?");
    updateConversation(conversationId, {
      state: "ask_address",
      draftJson: "{}",
    });
    return;
  }

  const zone = guessZone(draft.address);
  const driver = pickDriver(zone);
  const product = db
    .select()
    .from(products)
    .where(eq(products.id, draft.productId))
    .get();

  const order = db
    .insert(orders)
    .values({
      customerId,
      driverId: driver?.id ?? null,
      conversationId,
      address: draft.address,
      zone,
      productId: draft.productId,
      quantity: draft.quantity,
      paymentMethod: draft.paymentMethod,
      paymentStatus:
        draft.paymentMethod === "prepaid" ? "paid_prepaid" : "pending",
      deliveryStatus: "confirmed",
    })
    .returning()
    .get();

  db.update(customers)
    .set({
      lastAddress: draft.address,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(customers.id, customerId))
    .run();

  db.insert(orderEvents)
    .values({
      orderId: order.id,
      actor: "customer",
      actionCode: "confirmed",
      summary: "Pedido confirmado por el cliente",
      payloadJson: JSON.stringify(draft),
    })
    .run();

  const sheet = await appendOrderToSheet({
    orderId: order.id,
    code: orderCode(order.id),
    customerPhone: phone,
    address: draft.address,
    product: product?.name || String(draft.productId),
    quantity: draft.quantity,
    paymentMethod: draft.paymentMethod,
    driverName: driver?.name || "",
    zone,
  });

  if (sheet.row) {
    db.update(orders)
      .set({ sheetRow: sheet.row })
      .where(eq(orders.id, order.id))
      .run();
  }

  await dispatchOrder(order.id);

  await reply(
    phone,
    conversationId,
    `✅ Pedido ${orderCode(order.id)} tomado.\n${draft.quantity} × ${product?.name}\n📍 ${draft.address}\n💳 ${PAYMENT_LABELS[draft.paymentMethod] || draft.paymentMethod}\n\nEl camión te va a avisar por este mismo chat cuando esté llegando.`,
  );

  updateConversation(conversationId, {
    state: "completed",
    draftJson: "{}",
  });

  db.insert(auditEvents)
    .values({
      kind: "order_confirmed",
      summary: `Pedido ${orderCode(order.id)} confirmado`,
      payloadJson: JSON.stringify({ orderId: order.id }),
    })
    .run();
}

export async function handleCustomerMessage(inbound: NormalizedInbound) {
  const db = getDb();
  const phone = inbound.from;
  const customer = getOrCreateCustomer(phone, inbound.contactName);
  let conversation = getOrCreateConversation(phone, customer.id);

  db.insert(messages)
    .values({
      conversationId: conversation.id,
      direction: "inbound",
      waMessageId: inbound.waMessageId,
      body: inbound.text || inbound.interactiveId || "(vacío)",
      rawJson: JSON.stringify(inbound.raw),
    })
    .run();

  if (conversation.humanTakeover) {
    return { handled: true, reason: "human_takeover" };
  }

  const text = inbound.text.toLowerCase();
  if (
    text.includes("hablar con alguien") ||
    text.includes("operador") ||
    text.includes("humano")
  ) {
    updateConversation(conversation.id, { humanTakeover: true, state: "human" });
    await reply(
      phone,
      conversation.id,
      "Perfecto, te paso con alguien del local. En un momento te responden.",
    );
    return { handled: true, reason: "handoff" };
  }

  if (text === "hola" || text === "buenas" || text.includes("buen día") || text.includes("buen dia") || conversation.state === "greeting" || conversation.state === "idle" || conversation.state === "completed") {
    if (
      conversation.state === "completed" ||
      conversation.state === "idle" ||
      conversation.state === "greeting"
    ) {
      // start fresh if completed
      if (conversation.state === "completed") {
        conversation = db
          .insert(conversations)
          .values({
            role: "customer",
            phone,
            customerId: customer.id,
            state: "ask_address",
            draftJson: "{}",
          })
          .returning()
          .get();
        db.insert(messages)
          .values({
            conversationId: conversation.id,
            direction: "inbound",
            waMessageId: inbound.waMessageId,
            body: inbound.text,
            rawJson: JSON.stringify(inbound.raw),
          })
          .run();
      }

      const buttons = customer.lastAddress
        ? [
            { id: "addr:reuse", title: "Misma dirección" },
            { id: "addr:new", title: "Otra dirección" },
          ]
        : undefined;

      await reply(
        phone,
        conversation.id,
        `¡Hola! Soy el asistente de El Bárbara 🔥\nGas envasado a domicilio.\n\n${
          customer.lastAddress
            ? `La última dirección que tenemos es:\n📍 ${customer.lastAddress}\n\n¿Repetimos esa o es otra?`
            : "¿Cuál es la dirección de entrega?"
        }`,
        buttons ? { buttons } : undefined,
      );
      updateConversation(conversation.id, {
        state: customer.lastAddress ? "ask_address_choice" : "ask_address",
      });
      return { handled: true };
    }
  }

  const draft = parseDraft(conversation.draftJson);
  const interactiveId = inbound.interactiveId || "";

  switch (conversation.state) {
    case "ask_address_choice": {
      if (interactiveId === "addr:reuse" || text.includes("misma")) {
        draft.address = customer.lastAddress || undefined;
        updateConversation(conversation.id, {
          state: "ask_product",
          draftJson: JSON.stringify(draft),
        });
        await askProduct(phone, conversation.id);
        break;
      }
      updateConversation(conversation.id, { state: "ask_address" });
      await reply(phone, conversation.id, "Dale, ¿cuál es la nueva dirección?");
      break;
    }
    case "ask_address": {
      if (!inbound.text || inbound.text.length < 5) {
        await reply(
          phone,
          conversation.id,
          "Necesito una dirección un poco más completa (calle y altura).",
        );
        break;
      }
      draft.address = inbound.text;
      updateConversation(conversation.id, {
        state: "ask_product",
        draftJson: JSON.stringify(draft),
      });
      await askProduct(phone, conversation.id);
      break;
    }
    case "ask_product": {
      const productId = interactiveId.startsWith("product:")
        ? Number(interactiveId.replace("product:", ""))
        : null;
      const allProducts = db
        .select()
        .from(products)
        .where(eq(products.active, true))
        .all();
      const matched =
        (productId && allProducts.find((p) => p.id === productId)) ||
        allProducts.find((p) =>
          inbound.text.toLowerCase().includes(p.name.toLowerCase().split(" ")[0]),
        ) ||
        allProducts.find((p) =>
          inbound.text.toLowerCase().includes(p.code.split("_")[0]),
        );

      if (!matched) {
        await askProduct(phone, conversation.id, true);
        break;
      }
      draft.productId = matched.id;
      updateConversation(conversation.id, {
        state: "ask_quantity",
        draftJson: JSON.stringify(draft),
      });
      await reply(phone, conversation.id, `¿Cuántas unidades de ${matched.name} necesitás? (número)`, {
        buttons: [
          { id: "qty:1", title: "1" },
          { id: "qty:2", title: "2" },
          { id: "qty:3", title: "3" },
        ],
      });
      break;
    }
    case "ask_quantity": {
      const fromInteractive = interactiveId.startsWith("qty:")
        ? Number(interactiveId.replace("qty:", ""))
        : null;
      const qty = fromInteractive || Number(inbound.text.replace(/\D/g, ""));
      if (!qty || qty < 1 || qty > 20) {
        await reply(phone, conversation.id, "Decime un número entre 1 y 20.");
        break;
      }
      draft.quantity = qty;
      updateConversation(conversation.id, {
        state: "ask_payment",
        draftJson: JSON.stringify(draft),
      });
      await reply(phone, conversation.id, "¿Cómo vas a pagar?", {
        buttons: [
          { id: "pay:cash", title: "Efectivo" },
          { id: "pay:transfer", title: "Transferencia" },
          { id: "pay:prepaid", title: "Ya pagué" },
        ],
      });
      break;
    }
    case "ask_payment": {
      let method = "";
      if (interactiveId.startsWith("pay:")) {
        method = interactiveId.replace("pay:", "");
      } else if (text.includes("efectivo")) method = "cash";
      else if (text.includes("transfer")) method = "transfer";
      else if (text.includes("pagué") || text.includes("pague") || text.includes("prepago"))
        method = "prepaid";

      if (!["cash", "transfer", "prepaid"].includes(method)) {
        await reply(phone, conversation.id, "Elegí: efectivo, transferencia o ya pagué.", {
          buttons: [
            { id: "pay:cash", title: "Efectivo" },
            { id: "pay:transfer", title: "Transferencia" },
            { id: "pay:prepaid", title: "Ya pagué" },
          ],
        });
        break;
      }
      draft.paymentMethod = method;
      updateConversation(conversation.id, {
        state: "confirm",
        draftJson: JSON.stringify(draft),
      });
      const product = db
        .select()
        .from(products)
        .where(eq(products.id, draft.productId!))
        .get();
      await reply(
        phone,
        conversation.id,
        `Resumen:\n📍 ${draft.address}\n🛒 ${draft.quantity} × ${product?.name}\n💳 ${PAYMENT_LABELS[method]}\n\n¿Confirmamos el pedido?`,
        {
          buttons: [
            { id: "confirm:yes", title: "Confirmar" },
            { id: "confirm:no", title: "Cancelar" },
          ],
        },
      );
      break;
    }
    case "confirm": {
      if (interactiveId === "confirm:no" || text.includes("cancel")) {
        updateConversation(conversation.id, {
          state: "cancelled",
          draftJson: "{}",
        });
        await reply(phone, conversation.id, "Pedido cancelado. Cuando quieras, escribí «hola» para empezar de nuevo.");
        break;
      }
      if (interactiveId === "confirm:yes" || text.includes("confirm") || text === "si" || text === "sí") {
        await confirmOrder({
          conversationId: conversation.id,
          customerId: customer.id,
          phone,
          draft,
        });
        break;
      }
      await reply(phone, conversation.id, "¿Confirmamos? Tocá Confirmar o Cancelar.", {
        buttons: [
          { id: "confirm:yes", title: "Confirmar" },
          { id: "confirm:no", title: "Cancelar" },
        ],
      });
      break;
    }
    default: {
      updateConversation(conversation.id, { state: "ask_address", draftJson: "{}" });
      await reply(
        phone,
        conversation.id,
        "¡Hola! Soy el asistente de El Bárbara. ¿Cuál es la dirección de entrega?",
      );
    }
  }

  return { handled: true };
}

async function askProduct(phone: string, conversationId: number, again = false) {
  const allProducts = getDb()
    .select()
    .from(products)
    .where(eq(products.active, true))
    .all();
  await reply(
    phone,
    conversationId,
    again
      ? "No te entendí. Elegí el producto de la lista:"
      : "¿Qué estás buscando?",
    {
      list: {
        buttonLabel: "Ver productos",
        sections: [
          {
            title: "Gas envasado",
            rows: allProducts.map((p) => ({
              id: `product:${p.id}`,
              title: p.name,
              description: p.price ? `$${p.price.toLocaleString("es-AR")}` : undefined,
            })),
          },
        ],
      },
    },
  );
}

export { dispatchOrder };