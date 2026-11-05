import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import type { OAuthProvider } from "./types";

const STATE_COOKIE = "crucible_oauth_state";
const PKCE_COOKIE = "crucible_oauth_pkce";
const TTL_MS = 1000 * 60 * 10;

function secret() {
  return process.env.SESSION_SECRET || process.env.SETUP_SECRET || "crucible-dev-oauth";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function cookieSecure() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  return appUrl.startsWith("https://") || process.env.VERCEL === "1";
}

export function createPkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export async function issueOAuthState(provider: OAuthProvider, pkceVerifier?: string) {
  const nonce = nanoid(24);
  const exp = Date.now() + TTL_MS;
  const body = `${provider}.${nonce}.${exp}`;
  const value = `${body}.${sign(body)}`;
  const jar = await cookies();
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(),
    path: "/",
    maxAge: TTL_MS / 1000,
  };
  jar.set(STATE_COOKIE, value, common);
  if (pkceVerifier) {
    jar.set(PKCE_COOKIE, pkceVerifier, common);
  } else {
    jar.delete(PKCE_COOKIE);
  }
  return value;
}

export async function consumeOAuthState(expectedProvider: OAuthProvider, presented?: string | null) {
  const jar = await cookies();
  const cookieVal = jar.get(STATE_COOKIE)?.value;
  const pkce = jar.get(PKCE_COOKIE)?.value ?? null;
  jar.delete(STATE_COOKIE);
  jar.delete(PKCE_COOKIE);
  const value = presented || cookieVal;
  if (!value) return { ok: false as const, pkce: null };
  const parts = value.split(".");
  if (parts.length !== 4) return { ok: false as const, pkce: null };
  const [provider, , expStr, sig] = parts;
  const body = parts.slice(0, 3).join(".");
  if (provider !== expectedProvider) return { ok: false as const, pkce: null };
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return { ok: false as const, pkce: null };
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false as const, pkce: null };
  } catch {
    return { ok: false as const, pkce: null };
  }
  return { ok: true as const, pkce };
}
