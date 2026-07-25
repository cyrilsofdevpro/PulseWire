import { timingSafeEqual } from 'crypto'
import type { IncomingMessage } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  generateToken,
  requireAdmin,
  requireAuth,
  getTokenFromRequest,
  JwtPayload,
  JwtError,
} from './jwt'

const ADMIN_COOKIE_NAME = 'pulsewire_admin_token'
const SESSION_COOKIE_NAME = 'pulsewire_auth_token'
const TOKEN_MAX_AGE = parseInt(process.env.JWT_EXPIRES_IN || '86400', 10)
const COOKIE_PATH = '/'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

export function getAdminPasswordConfigured() {
  return ADMIN_PASSWORD.length > 0
}

export function verifyAdminPassword(password: string) {
  if (!ADMIN_PASSWORD) return false
  const input = Buffer.from(password, 'utf8')
  const stored = Buffer.from(ADMIN_PASSWORD, 'utf8')
  if (input.length !== stored.length) {
    return false
  }
  return timingSafeEqual(input, stored)
}

function serializeCookie(name: string, value: string, options: Record<string, unknown> = {}) {
  const encodedValue = encodeURIComponent(value)
  const segments = [`${name}=${encodedValue}`]
  if (options.maxAge !== undefined) segments.push(`Max-Age=${options.maxAge}`)
  if (options.domain) segments.push(`Domain=${options.domain}`)
  if (options.path) segments.push(`Path=${options.path}`)
  if (options.expires) segments.push(`Expires=${options.expires}`)
  if (options.httpOnly) segments.push('HttpOnly')
  if (options.secure) segments.push('Secure')
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`)
  return segments.join('; ')
}

export function createAdminToken() {
  return generateToken('admin', {
    role: 'admin',
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  })
}

export function createUserToken(userId: string, role = 'user') {
  return generateToken(userId, {
    role,
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  })
}

function cookieOptions(maxAge: number) {
  return {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge,
  }
}

export function setAdminSessionCookie(res: NextApiResponse, token: string) {
  res.setHeader('Set-Cookie', serializeCookie(ADMIN_COOKIE_NAME, token, cookieOptions(TOKEN_MAX_AGE)))
}

export function setUserSessionCookie(res: NextApiResponse, token: string) {
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, token, cookieOptions(TOKEN_MAX_AGE)))
}

export function clearAdminSessionCookie(res: NextApiResponse) {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(ADMIN_COOKIE_NAME, '', {
      path: COOKIE_PATH,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 0,
    })
  )
}

export function clearUserSessionCookie(res: NextApiResponse) {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE_NAME, '', {
      path: COOKIE_PATH,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 0,
    })
  )
}

export function isAdminAuthenticated(req: NextApiRequest | IncomingMessage) {
  try {
    const token = getTokenFromRequest(req, ADMIN_COOKIE_NAME)
    if (!token) return false
    requireAdmin(req, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
      cookieName: ADMIN_COOKIE_NAME,
    })
    return true
  } catch {
    return false
  }
}

export function authenticateAdminRequest(req: NextApiRequest | IncomingMessage) {
  try {
    return requireAdmin(req, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
      cookieName: ADMIN_COOKIE_NAME,
    }) as JwtPayload
  } catch (error) {
    if (error instanceof JwtError) {
      throw error
    }
    throw new JwtError('INVALID_TOKEN', 'Admin authentication failed.')
  }
}

export function authenticateUserRequest(req: NextApiRequest | IncomingMessage) {
  try {
    return requireAuth(req, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
      cookieName: SESSION_COOKIE_NAME,
    }) as JwtPayload
  } catch (error) {
    if (error instanceof JwtError) {
      throw error
    }
    throw new JwtError('INVALID_TOKEN', 'Authentication failed.')
  }
}
