/** Shared between Node route handlers and Edge middleware. */
export const SESSION_COOKIE = "elbarbagas_session";

export function getAuthSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "el-barba-gas-dev-secret"
  );
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "barbara-demo";
}