import { config, sheetsConfigured } from "@/lib/config";
import { getDb } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";

export type SheetOrderRow = {
  orderId: number;
  code: string;
  customerPhone: string;
  address: string;
  product: string;
  quantity: number;
  paymentMethod: string;
  driverName: string;
  zone: string;
};

/**
 * Appends a row to Google Sheets when credentials exist.
 * In demo mode (no credentials), logs an audit event and returns a fake row number.
 */
export async function appendOrderToSheet(row: SheetOrderRow) {
  const values = [
    new Date().toISOString(),
    row.code,
    row.customerPhone,
    row.address,
    row.product,
    String(row.quantity),
    row.paymentMethod,
    row.driverName,
    row.zone,
    "confirmed",
  ];

  if (!sheetsConfigured()) {
    getDb()
      .insert(auditEvents)
      .values({
        kind: "sheets_demo",
        summary: `Espejo Sheets (demo) ${row.code}`,
        payloadJson: JSON.stringify(values),
      })
      .run();
    return { ok: true, demo: true, row: row.orderId };
  }

  try {
    const token = await getGoogleAccessToken();
    const range = encodeURIComponent("Pedidos!A:J");
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.sheets.sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [values] }),
      },
    );
    const raw = await res.json();
    if (!res.ok) {
      getDb()
        .insert(auditEvents)
        .values({
          kind: "sheets_error",
          summary: "Error append Sheets",
          payloadJson: JSON.stringify(raw),
        })
        .run();
      return { ok: false, demo: false, error: raw };
    }
    const updatedRange = (raw as { updates?: { updatedRange?: string } })
      ?.updates?.updatedRange;
    const rowMatch = updatedRange?.match(/![A-Z]+(\d+)/);
    return {
      ok: true,
      demo: false,
      row: rowMatch ? Number(rowMatch[1]) : undefined,
    };
  } catch (error) {
    getDb()
      .insert(auditEvents)
      .values({
        kind: "sheets_error",
        summary: "Exception Sheets",
        payloadJson: JSON.stringify({
          error: error instanceof Error ? error.message : "unknown",
        }),
      })
      .run();
    return { ok: false, demo: false };
  }
}

async function getGoogleAccessToken() {
  const creds = JSON.parse(config.sheets.serviceAccountJson) as {
    client_email: string;
    private_key: string;
    token_uri?: string;
  };

  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const claim = btoa(
    JSON.stringify({
      iss: creds.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: creds.token_uri || "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Prefer jose for signing when available via dynamic import in Node
  const { SignJWT, importPKCS8 } = await import("jose");
  const key = await importPKCS8(
    creds.private_key.replace(/\\n/g, "\n"),
    "RS256",
  );
  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/spreadsheets",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(creds.client_email)
    .setAudience(creds.token_uri || "https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  void header;
  void claim;

  const tokenRes = await fetch(
    creds.token_uri || "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    },
  );
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("No access_token from Google");
  }
  return tokenJson.access_token;
}