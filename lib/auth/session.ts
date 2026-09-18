import { createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'kts_session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

interface SessionPayload {
  wallet: string
  exp: number
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET is not set')
  }
  return secret
}

export function signSession(wallet: string, now: number = Date.now()): string {
  const payload: SessionPayload = { wallet, exp: now + SESSION_TTL_SECONDS * 1000 }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', getSecret()).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function verifySession(
  token: string | null | undefined,
  now: number = Date.now(),
): SessionPayload | null {
  if (!token) {
    return null
  }
  const separator = token.lastIndexOf('.')
  if (separator <= 0) {
    return null
  }
  const body = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  const expected = createHmac('sha256', getSecret()).update(body).digest('base64url')
  const provided = Buffer.from(signature)
  const wanted = Buffer.from(expected)
  if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (typeof payload.wallet !== 'string' || typeof payload.exp !== 'number' || payload.exp < now) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export function sessionCookieOptions(): {
  httpOnly: true
  secure: true
  sameSite: 'lax'
  path: '/'
  maxAge: number
} {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) {
    return null
  }
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) {
      return rest.join('=')
    }
  }
  return null
}

export function getSessionWallet(request: Request, now: number = Date.now()): string | null {
  const session = verifySession(readCookie(request, SESSION_COOKIE), now)
  return session?.wallet ?? null
}
