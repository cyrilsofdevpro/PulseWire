import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

export const ADMIN_COOKIE_NAME = 'pw_admin_session';
export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8;

const ADMIN_SECRET = process.env.PULSEWIRE_ADMIN_SECRET || 'pulsewire-admin-dev-secret';
const ADMIN_PASSWORD = process.env.PULSEWIRE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
const ADMIN_PASSWORD_HASH = process.env.PULSEWIRE_ADMIN_PASSWORD_HASH;

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

export function verifyAdminPassword(password: string) {
  if (!password) return false;
  if (!ADMIN_PASSWORD && !ADMIN_PASSWORD_HASH) return false;
  if (ADMIN_PASSWORD_HASH) {
    return safeEqual(hashPassword(password), ADMIN_PASSWORD_HASH);
  }
  return safeEqual(password, ADMIN_PASSWORD || '');
}

export function createAdminSessionToken() {
  const issuedAt = Date.now().toString();
  const nonce = randomUUID();
  const payload = `${issuedAt}.${nonce}`;
  const signature = createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [issuedAt, nonce, signature] = parts;
  if (!issuedAt || !nonce || !signature) return false;
  const payload = `${issuedAt}.${nonce}`;
  const expected = createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  if (!safeEqual(signature, expected)) return false;
  const age = Date.now() - Number(issuedAt);
  return age > 0 && age < ADMIN_SESSION_TTL_MS;
}

export function getAdminSessionToken(req: { headers?: { cookie?: string } }) {
  const cookieHeader = req.headers?.cookie || '';
  const cookies = cookieHeader.split(';').map((item) => item.trim());
  const sessionCookie = cookies.find((item) => item.startsWith(`${ADMIN_COOKIE_NAME}=`));
  if (!sessionCookie) return null;
  return decodeURIComponent(sessionCookie.slice(ADMIN_COOKIE_NAME.length + 1));
}

export function setAdminSessionCookie(
  res: { setHeader: (name: string, value: string | string[] | undefined) => void },
  token: string,
  req?: { headers?: { 'x-forwarded-proto'?: string } }
) {
  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const secure = process.env.NODE_ENV === 'production' || forwardedProto === 'https';
  const cookie = `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${Math.floor(ADMIN_SESSION_TTL_MS / 1000)}; SameSite=Lax${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookie);
}

export function clearAdminSessionCookie(res: { setHeader: (name: string, value: string | string[] | undefined) => void }) {
  const cookie = `${ADMIN_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
  res.setHeader('Set-Cookie', cookie);
}

export function isAdminAuthenticated(req: { headers?: { cookie?: string } }) {
  return verifyAdminSessionToken(getAdminSessionToken(req));
}

export function getAdminPasswordConfigured() {
  return Boolean(ADMIN_PASSWORD || ADMIN_PASSWORD_HASH);
}
