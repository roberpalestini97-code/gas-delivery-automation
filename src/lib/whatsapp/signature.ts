import { createHmac, timingSafeEqual } from "crypto";
import { config } from "@/lib/config";

/**
 * Validates Meta X-Hub-Signature-256 when WHATSAPP_APP_SECRET is set.
 * If the secret is empty (demo), verification is skipped.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = config.whatsapp.appSecret;
  if (!secret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const incoming = signatureHeader.slice("sha256=".length);
  try {
    return timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(incoming, "utf8"),
    );
  } catch {
    return false;
  }
}