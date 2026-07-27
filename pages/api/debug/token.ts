import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

function base64UrlDecode(input: string) {
  // replace URL-safe chars, add padding
  let str = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = str.length % 4
  if (pad === 2) str += '=='
  else if (pad === 3) str += '='
  else if (pad !== 0) str += '=='
  try {
    return Buffer.from(str, 'base64').toString('utf8')
  } catch (e) {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization || ''
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined
    const tokenFromBody = typeof req.body === 'string' ? (JSON.parse(req.body || '{}')?.token) : (req.body?.token)
    const rawToken = (tokenFromHeader || tokenFromBody || req.query.token || '').toString().replace(/\s+/g, '')

    if (!rawToken) return res.status(400).json({ error: 'No token provided. Send in Authorization header or { token } body.' })

    const parts = rawToken.split('.')
    const result: any = { parts: parts.length, header: null, payload: null, signature: null, parseErrors: [] }

    if (parts.length >= 2) {
      try {
        const hdr = base64UrlDecode(parts[0])
        result.header = hdr ? JSON.parse(hdr) : hdr
      } catch (e: any) {
        result.parseErrors.push({ part: 'header', message: e?.message || String(e) })
      }

      try {
        const pld = base64UrlDecode(parts[1])
        result.payload = pld ? JSON.parse(pld) : pld
      } catch (e: any) {
        result.parseErrors.push({ part: 'payload', message: e?.message || String(e) })
      }
    }

    if (parts.length >= 3) result.signature = parts[2]

    // Optionally attempt server-side verification using supabaseAdmin
    if (supabaseAdmin) {
      try {
        const verify = await supabaseAdmin.auth.getUser(rawToken)
        result.supabase = { data: verify?.data ?? null, error: verify?.error ? { message: verify.error.message || verify.error.toString(), status: (verify as any).error?.status || null, code: (verify as any).error?.code || null } : null }
      } catch (e: any) {
        result.supabase = { data: null, error: { message: e?.message || String(e) } }
      }
    } else {
      result.supabase = { note: 'supabaseAdmin not configured on server' }
    }

    return res.status(200).json({ success: true, tokenPresent: true, result })
  } catch (err: any) {
    console.error('debug/token error:', err)
    return res.status(500).json({ error: err?.message || String(err) })
  }
}
