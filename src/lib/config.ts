export const config = {
  appName: "El Barba Gas",
  adminPassword: process.env.ADMIN_PASSWORD || "barbara-demo",
  authSecret: process.env.AUTH_SECRET || "el-barba-gas-dev-secret",
  demoMode: process.env.DEMO_MODE !== "false",
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "el-barbara-verify",
    appSecret: process.env.WHATSAPP_APP_SECRET || "",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
  },
  sheets: {
    sheetId: process.env.SHEET_ID || "",
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "",
  },
  dbPath: process.env.DATABASE_PATH || "data/elbarbara.db",
};

export function whatsappConfigured() {
  return Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId);
}

export function sheetsConfigured() {
  return Boolean(config.sheets.sheetId && config.sheets.serviceAccountJson);
}