import { NextResponse } from 'next/server'
import { isSameOrigin } from '@/lib/auth/origin'
import { SESSION_COOKIE, getSessionWallet, sessionCookieOptions } from '@/lib/auth/session'
import { apiError } from '@/lib/http/error'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return apiError(403, 'FORBIDDEN_ORIGIN', 'Request origin is not allowed.')
  }
  if (!getSessionWallet(request)) {
    return apiError(401, 'UNAUTHENTICATED', 'No active session.')
  }

  const response = new NextResponse(null, { status: 204 })
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  return response
}
