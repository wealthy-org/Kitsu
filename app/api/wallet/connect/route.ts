import { NextResponse } from 'next/server'
import { z } from 'zod'
import { redeemNonce } from '@/lib/auth/nonce'
import { DbNonceStore } from '@/lib/auth/nonce-store'
import { isSameOrigin } from '@/lib/auth/origin'
import { parseSiweNonce, verifySiweMessage } from '@/lib/auth/siwe'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
  signSession,
} from '@/lib/auth/session'
import { apiError } from '@/lib/http/error'

const bodySchema = z.object({
  wallet_address: z.string().min(1).max(128),
  message: z.string().min(1),
  signature: z.string().min(1),
})

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return apiError(403, 'FORBIDDEN_ORIGIN', 'Request origin is not allowed.')
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Request body must be valid JSON.')
  }

  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    return apiError(400, 'VALIDATION_ERROR', 'wallet_address, message, and signature are required.')
  }

  const { wallet_address, message, signature } = parsed.data
  const nonce = parseSiweNonce(message)
  if (!nonce) {
    return apiError(401, 'SIWE_INVALID', 'SIWE message could not be parsed.')
  }

  const verified = await verifySiweMessage({ message, signature, nonce })
  if (!verified) {
    return apiError(401, 'SIWE_INVALID', 'SIWE signature is invalid.')
  }
  if (verified.address.toLowerCase() !== wallet_address.toLowerCase()) {
    return apiError(401, 'SIWE_INVALID', 'Wallet address does not match the signed message.')
  }

  const redeemed = await redeemNonce(new DbNonceStore(), nonce, wallet_address, 'login')
  if (redeemed.status === 'expired') {
    return apiError(401, 'NONCE_EXPIRED', 'Nonce has expired.')
  }
  if (redeemed.status !== 'ok') {
    return apiError(409, 'NONCE_REUSED', 'Nonce is unknown or already used.')
  }

  const address = verified.address.toLowerCase()
  const response = NextResponse.json({
    wallet_address: address,
    session_expires_at: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
  })
  response.cookies.set(SESSION_COOKIE, signSession(address), sessionCookieOptions())
  return response
}
