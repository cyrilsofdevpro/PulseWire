import { createHmac } from 'crypto'
import type { IncomingMessage } from 'http'
import type { NextApiRequest } from 'next'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error(
    'Missing required environment variable JWT_SECRET. Set JWT_SECRET to a long cryptographically secure random string.'
  )
}

const DEFAULT_ISSUER = process.env.JWT_ISSUER || 'pulsewire.app'
const DEFAULT_AUDIENCE = process.env.JWT_AUDIENCE || 'pulsewire'
const DEFAULT_EXPIRES_IN = parseExpiration(process.env.JWT_EXPIRES_IN || '24h')

export type JwtPayload = {
  sub: string
  role?: string
  iss?: string
  aud?: string
  iat: number
  exp: number
  [key: string]: unknown
}

export type JwtVerifyOptions = {
  issuer?: string
  audience?: string
  clockToleranceSeconds?: number
}

export type JwtGenerateOptions = {
  role?: string
  issuer?: string
  audience?: string
  expiresIn?: string | number
  extra?: Record<string, unknown>
}

export class JwtError extends Error {
  code:
    | 'MISSING_TOKEN'
    | 'INVALID_TOKEN'
    | 'EXPIRED_TOKEN'
    | 'INVALID_SIGNATURE'
    | 'MISSING_SECRET'

  constructor(code: JwtError['code'], message: string) {
    super(message)
    this.name = 'JwtError'
    this.code = code
  }
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=')
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

export function parseExpiration(value: string | number): number {
  if (typeof value === 'number') return value
  const trimmed = String(value).trim().toLowerCase()
  if (/^[0-9]+$/.test(trimmed)) return Number(trimmed)
  const match = trimmed.match(/^([0-9]+)(s|m|h|d)$/)
  if (!match) {
    throw new Error('Invalid JWT_EXPIRES_IN value. Use seconds or suffix s/m/h/d, for example 24h.')
  }

  const amount = Number(match[1])
  switch (match[2]) {
    case 's':
      return amount
    case 'm':
      return amount * 60
    case 'h':
      return amount * 60 * 60
    case 'd':
      return amount * 60 * 60 * 24
    default:
      throw new Error('Invalid JWT_EXPIRES_IN unit.')
  }
}

function sign(data: string) {
  return base64UrlEncode(createHmac('sha256', JWT_SECRET).update(data).digest())
}

function serializePayload(payload: unknown) {
  return JSON.stringify(payload)
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T
}

function parseJwt(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new JwtError('INVALID_TOKEN', 'JWT must have three parts.')
  }
  return {
    encodedHeader: parts[0],
    encodedPayload: parts[1],
    signature: parts[2],
  }
}

export function generateToken(subject: string, options: JwtGenerateOptions = {}) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = options.expiresIn
    ? parseExpiration(options.expiresIn)
    : DEFAULT_EXPIRES_IN

  const payload: Record<string, unknown> = {
    sub: subject,
    iat: now,
    exp: now + expiresIn,
    iss: options.issuer || DEFAULT_ISSUER,
    aud: options.audience || DEFAULT_AUDIENCE,
    role: options.role,
    ...options.extra,
  }

  const encodedHeader = base64UrlEncode(serializePayload(header))
  const encodedPayload = base64UrlEncode(serializePayload(payload))
  const signature = sign(`${encodedHeader}.${encodedPayload}`)

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function decodeToken(token: string) {
  try {
    const { encodedHeader, encodedPayload, signature } = parseJwt(token)
    const header = parseJson<Record<string, unknown>>(base64UrlDecode(encodedHeader))
    const payload = parseJson<Record<string, unknown>>(base64UrlDecode(encodedPayload))
    return {
      header,
      payload,
      signature,
    }
  } catch {
    return null
  }
}

export function verifyToken(token: string, options: JwtVerifyOptions = {}) {
  if (!token) {
    throw new JwtError('MISSING_TOKEN', 'JWT access token is required.')
  }

  const { encodedHeader, encodedPayload, signature } = parseJwt(token)
  const expected = sign(`${encodedHeader}.${encodedPayload}`)
  if (!timingSafeEqual(signature, expected)) {
    throw new JwtError('INVALID_SIGNATURE', 'JWT signature is invalid.')
  }

  const header = parseJson<Record<string, unknown>>(base64UrlDecode(encodedHeader))
  if (header.alg !== 'HS256') {
    throw new JwtError('INVALID_TOKEN', 'JWT algorithm must be HS256.')
  }

  const payload = parseJson<Record<string, unknown>>(base64UrlDecode(encodedPayload)) as JwtPayload
  const now = Math.floor(Date.now() / 1000)

  if (typeof payload.exp !== 'number') {
    throw new JwtError('INVALID_TOKEN', 'JWT expiration time is invalid.')
  }

  const tolerance = options.clockToleranceSeconds ?? 0
  if (payload.exp + tolerance < now) {
    throw new JwtError('EXPIRED_TOKEN', 'JWT token has expired.')
  }

  if (options.issuer && payload.iss !== options.issuer) {
    throw new JwtError('INVALID_TOKEN', 'JWT issuer is invalid.')
  }

  if (options.audience && payload.aud !== options.audience) {
    throw new JwtError('INVALID_TOKEN', 'JWT audience is invalid.')
  }

  return payload
}

export function getUserFromToken(token: string, options: JwtVerifyOptions = {}) {
  return verifyToken(token, options)
}

export function getTokenFromRequest(
  req: NextApiRequest | IncomingMessage,
  cookieName = 'auth_token'
) {
  const authHeader = String(req.headers?.authorization || '')
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim() || null
  }

  const cookieHeader = String(req.headers?.cookie || '')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, raw) => {
    const [key, ...rest] = raw.trim().split('=')
    if (!key) return acc
    acc[key] = decodeURIComponent(rest.join('='))
    return acc
  }, {})

  return cookies[cookieName] || null
}

export function requireAuth(
  req: NextApiRequest | IncomingMessage,
  options: JwtVerifyOptions & { cookieName?: string } = {}
) {
  const token = getTokenFromRequest(req, options.cookieName || 'auth_token')
  if (!token) {
    throw new JwtError('MISSING_TOKEN', 'Authentication token was not provided.')
  }
  return verifyToken(token, options)
}

export function requireAdmin(
  req: NextApiRequest | IncomingMessage,
  options: JwtVerifyOptions & { cookieName?: string } = {}
) {
  const payload = requireAuth(req, options)
  if (payload.role !== 'admin') {
    throw new JwtError('INVALID_TOKEN', 'Admin access is required.')
  }
  return payload
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) {
    return false
  }
  return createHmac('sha256', JWT_SECRET).update(aBuf).digest().equals(
    createHmac('sha256', JWT_SECRET).update(bBuf).digest()
  )
}
