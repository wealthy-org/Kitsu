import { NextResponse } from 'next/server'
import { isSameOrigin } from '@/lib/auth/origin'
import { DbSessionStore } from '@/lib/auth/session-store'
import {
  SESSION_COOKIE,
  readSessionToken,
  resolveSessionWallet,
  sessionCookieOptions,
} from '@/lib/auth/session'
import { apiError } from '@/lib/http/error'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return apiError(403, 'FORBIDDEN_ORIGIN', 'Request origin is not allowed.')
  }

  const store = new DbSessionStore()
  const token = readSessionToken(request)
  if (!(await resolveSessionWallet(store, token))) {
    return apiError(401, 'UNAUTHENTICATED', 'No active session.')
  }

  await store.delete(token as string)

  const response = new NextResponse(null, { status: 204 })
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  return response
}
