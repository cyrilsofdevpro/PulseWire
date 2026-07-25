import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminToken, setAdminSessionCookie, verifyAdminPassword, getAdminPasswordConfigured } from '../../../lib/adminAuth';

const failedAttempts = new Map<string, number>();

function getClientIp(req: NextApiRequest) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!getAdminPasswordConfigured()) {
    return res.status(503).json({ error: 'Admin password is not configured on the server.' });
  }

  const ip = getClientIp(req);
  const current = failedAttempts.get(ip) || 0;
  if (current >= 8) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  }

  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!verifyAdminPassword(password)) {
    failedAttempts.set(ip, current + 1);
    console.warn(`[admin] failed login attempt from ${ip}`);
    return res.status(401).json({ error: 'Invalid admin password.' });
  }

  failedAttempts.delete(ip);
  const token = createAdminToken();
  setAdminSessionCookie(res, token);
  return res.status(200).json({ ok: true, redirectTo: '/pulsewire/admin' });
}
