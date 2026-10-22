import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "@/lib/config";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

const globalForDb = globalThis as unknown as {
  __elBarbaraDb?: ReturnType<typeof createDb>;
};

function resolveDbPath() {
  const configured = config.dbPath;
  if (path.isAbsolute(configured)) return configured;
  return path.join(process.cwd(), configured);
}

function createDb() {
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      name TEXT,
      last_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      zones TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      unit_label TEXT NOT NULL DEFAULT 'u',
      price REAL,
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      phone TEXT NOT NULL,
      customer_id INTEGER,
      driver_id INTEGER,
      state TEXT NOT NULL DEFAULT 'idle',
      draft_json TEXT NOT NULL DEFAULT '{}',
      human_takeover INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      direction TEXT NOT NULL,
      wa_message_id TEXT,
      body TEXT NOT NULL,
      raw_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      driver_id INTEGER,
      conversation_id INTEGER,
      address TEXT NOT NULL,
      zone TEXT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      delivery_status TEXT NOT NULL DEFAULT 'draft',
      notes TEXT,
      sheet_row INTEGER,
      deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_dispatch_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      wa_message_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS driver_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      aliases_json TEXT NOT NULL DEFAULT '[]',
      notify_customer INTEGER NOT NULL DEFAULT 1,
      customer_template TEXT NOT NULL DEFAULT '',
      delivery_status TEXT,
      payment_status TEXT,
      needs_extra TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      actor TEXT NOT NULL,
      action_code TEXT,
      summary TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      wa_message_in_id TEXT,
      wa_message_out_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Soft-delete column for DBs created before ABM
  try {
    sqlite.exec(`ALTER TABLE orders ADD COLUMN deleted_at TEXT`);
  } catch {
    // column already exists
  }

  const db = drizzle(sqlite, { schema });
  seedIfEmpty(db, sqlite);
  return { db, sqlite };
}

export function getDb() {
  if (!globalForDb.__elBarbaraDb) {
    globalForDb.__elBarbaraDb = createDb();
  }
  return globalForDb.__elBarbaraDb.db;
}

export function getSqlite() {
  if (!globalForDb.__elBarbaraDb) {
    globalForDb.__elBarbaraDb = createDb();
  }
  return globalForDb.__elBarbaraDb.sqlite;
}

export type AppDb = ReturnType<typeof getDb>;