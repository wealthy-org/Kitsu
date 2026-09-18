import { randomBytes } from 'node:crypto'

export const SESSION_COOKIE = 'kts_session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

export interface SessionRecord {
  token: string
  walletAddress: string
  expiresAt: Date
}

export interface SessionStore {
  create(record: SessionRecord): Promise<void>
  find(token: string): Promise<SessionRecord | null>
  delete(token: string): Promise<void>
}

export function sessionExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + SESSION_TTL_SECONDS * 1000)
}

export function createSessionToken(): string {
  return randomBytes(32).toString('hex')
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

export function readSessionToken(request: Request): string | null {
  const header = request.headers.get('cookie')
  if (!header) {
    return null
  }
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === SESSION_COOKIE) {
      return rest.join('=')
    }
  }
  return null
}

export async function resolveSessionWallet(
  store: SessionStore,
  token: string | null,
  now: number = Date.now(),
): Promise<string | null> {
  if (!token) {
    return null
  }
  const record = await store.find(token)
  if (!record || record.expiresAt.getTime() < now) {
    return null
  }
  return record.walletAddress
}

export async function getSessionWallet(
  store: SessionStore,
  request: Request,
): Promise<string | null> {
  return resolveSessionWallet(store, readSessionToken(request))
}

export class InMemorySessionStore implements SessionStore {
  private readonly records = new Map<string, SessionRecord>()

  async create(record: SessionRecord): Promise<void> {
    this.records.set(record.token, record)
  }

  async find(token: string): Promise<SessionRecord | null> {
    return this.records.get(token) ?? null
  }

  async delete(token: string): Promise<void> {
    this.records.delete(token)
  }
}
