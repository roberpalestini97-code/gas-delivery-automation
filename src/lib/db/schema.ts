import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  lastAddress: text("last_address"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const drivers = sqliteTable("drivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  zones: text("zones").notNull().default("[]"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  unitLabel: text("unit_label").notNull().default("u"),
  price: real("price"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  role: text("role").notNull(), // customer | driver
  phone: text("phone").notNull(),
  customerId: integer("customer_id"),
  driverId: integer("driver_id"),
  state: text("state").notNull().default("idle"),
  draftJson: text("draft_json").notNull().default("{}"),
  humanTakeover: integer("human_takeover", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull(),
  direction: text("direction").notNull(), // inbound | outbound
  waMessageId: text("wa_message_id"),
  body: text("body").notNull(),
  rawJson: text("raw_json"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull(),
  driverId: integer("driver_id"),
  conversationId: integer("conversation_id"),
  address: text("address").notNull(),
  zone: text("zone"),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  deliveryStatus: text("delivery_status").notNull().default("draft"),
  notes: text("notes"),
  sheetRow: integer("sheet_row"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const orderDispatchMessages = sqliteTable("order_dispatch_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  driverId: integer("driver_id").notNull(),
  waMessageId: text("wa_message_id").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const driverActions = sqliteTable("driver_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  aliasesJson: text("aliases_json").notNull().default("[]"),
  notifyCustomer: integer("notify_customer", { mode: "boolean" })
    .notNull()
    .default(true),
  customerTemplate: text("customer_template").notNull().default(""),
  deliveryStatus: text("delivery_status"),
  paymentStatus: text("payment_status"),
  needsExtra: text("needs_extra"), // minutes | note | null
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const orderEvents = sqliteTable("order_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  actor: text("actor").notNull(), // system | customer | driver | admin
  actionCode: text("action_code"),
  summary: text("summary").notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
  waMessageInId: text("wa_message_in_id"),
  waMessageOutId: text("wa_message_out_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  summary: text("summary").notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Customer = typeof customers.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type DriverAction = typeof driverActions.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Message = typeof messages.$inferSelect;