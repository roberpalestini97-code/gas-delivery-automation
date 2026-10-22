import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  config,
  sheetsConfigured,
  whatsappConfigured,
} from "@/lib/config";
import { getDb } from "@/lib/db";
import { auditEvents, drivers, orders, products } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const orderCount = db.select().from(orders).all().length;
  const driverCount = db.select().from(drivers).all().length;
  const productCount = db.select().from(products).all().length;
  const recentAudit = db
    .select()
    .from(auditEvents)
    .orderBy(desc(auditEvents.id))
    .limit(8)
    .all();

  const waReady = whatsappConfigured();
  const sheetsReady = sheetsConfigured();

  return NextResponse.json({
    app: config.appName,
    demoMode: config.demoMode || !waReady,
    whatsapp: {
      configured: waReady,
      phoneNumberIdSet: Boolean(config.whatsapp.phoneNumberId),
      tokenSet: Boolean(config.whatsapp.token),
      verifyToken: config.whatsapp.verifyToken,
      apiVersion: config.whatsapp.apiVersion,
      webhookPath: "/api/whatsapp/webhook",
      mode: waReady ? "live" : "demo_outbox",
    },
    sheets: {
      configured: sheetsReady,
      sheetIdSet: Boolean(config.sheets.sheetId),
      serviceAccountSet: Boolean(config.sheets.serviceAccountJson),
      mode: sheetsReady ? "live" : "demo_audit",
    },
    database: {
      path: config.dbPath,
      orders: orderCount,
      drivers: driverCount,
      products: productCount,
    },
    checklist: [
      {
        id: "meta_app",
        label: "Crear app en Meta Developers + WhatsApp product",
        done: waReady,
      },
      {
        id: "token",
        label: "Pegar WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID en .env.local",
        done: waReady,
      },
      {
        id: "webhook",
        label: "Apuntar webhook a /api/whatsapp/webhook con el verify token",
        done: waReady,
      },
      {
        id: "drivers",
        label: "Cargar teléfonos reales de repartidores en el back office",
        done: driverCount > 0,
      },
      {
        id: "sheets",
        label: "Opcional: service account + SHEET_ID para espejo Excel",
        done: sheetsReady,
      },
    ],
    recentAudit,
  });
}