import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";

export const SESSION_COOKIE_NAME = "dashboard_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

interface SessionPayload {
  auth: boolean;
  exp: number; // Unix timestamp in seconds
}

const encoder = new TextEncoder();

/**
 * Creates an HMAC-SHA256 signature using standard Web Crypto API.
 * Fully compatible with both Node.js and Edge runtimes.
 */
async function signData(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Encodes string to base64url format universally across runtimes.
 */
function toBase64Url(str: string): string {
  const bytes = encoder.encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decodes base64url string universally across runtimes.
 */
function fromBase64Url(base64url: string): string {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Signs and packages a session token string.
 */
export async function createSessionToken(
  secret: string = getEnv().SESSION_SECRET,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload: SessionPayload = { auth: true, exp };
  const payloadStr = toBase64Url(JSON.stringify(payload));
  const signature = await signData(payloadStr, secret);
  return `${payloadStr}.${signature}`;
}

/**
 * Verifies a session token string using constant-time comparison.
 * Returns true if the token is valid, unexpired, and properly signed.
 */
export async function verifySessionToken(
  token: string | null | undefined,
  secret: string = getEnv().SESSION_SECRET,
): Promise<boolean> {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payloadStr, receivedSignature] = parts;
  const expectedSignature = await signData(payloadStr, secret);

  if (receivedSignature.length !== expectedSignature.length) {
    return false;
  }

  // Constant-time string comparison to prevent timing attacks
  let mismatch = 0;
  for (let i = 0; i < receivedSignature.length; i++) {
    mismatch |= receivedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  if (mismatch !== 0) {
    return false;
  }

  // Check expiration
  try {
    const jsonStr = fromBase64Url(payloadStr);
    const payload = JSON.parse(jsonStr) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    return payload.auth === true && payload.exp > now;
  } catch {
    return false;
  }
}

/**
 * Verifies password using constant-time comparison to prevent timing attacks.
 */
export function verifyPassword(inputPassword: string, correctPassword: string): boolean {
  if (inputPassword.length !== correctPassword.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < inputPassword.length; i++) {
    mismatch |= inputPassword.charCodeAt(i) ^ correctPassword.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Sets session cookie on next/headers response.
 */
export async function setSessionCookie(): Promise<string> {
  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return token;
}

/**
 * Clears session cookie on next/headers response.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Checks if current request in Server Component or Route Handler is authenticated.
 */
export async function isCurrentSessionValid(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return verifySessionToken(sessionCookie?.value);
}
