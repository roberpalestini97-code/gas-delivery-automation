import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  getAdminPassword,
  getAuthSecret,
} from "@/lib/auth-shared";

function secretKey() {
  return new TextEncoder().encode(getAuthSecret());
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // Never force Secure in local/demo; Cloud preview proxies vary.
  secure: false,
  maxAge: 60 * 60 * 24 * 7,
};

export async function createSessionToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function attachSessionCookie(response: NextResponse) {
  const token = await createSessionToken();
  response.cookies.set(SESSION_COOKIE, token, cookieOptions);
  return response;
}

export async function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload;
  } catch {
    return null;
  }
}

export function verifyPassword(password: string) {
  const expected = getAdminPassword();
  return password.trim() === expected;
}

export async function getSession() {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireSession() {
  return getSession();
}