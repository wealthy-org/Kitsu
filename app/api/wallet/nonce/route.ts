import { NextResponse } from 'next/server'
import { z } from 'zod'
import { issueNonce } from '@/lib/auth/nonce'
import { DbNonceStore } from '@/lib/auth/nonce-store'
import { apiError } from '@/lib/http/error'

const querySchema = z.object({
  wallet: z.string().min(1).max(128),
  purpose: z.enum(['login', 'submit']).optional(),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    wallet: url.searchParams.get('wallet') ?? '',
    purpose: url.searchParams.get('purpose') ?? undefined,
  })
  if (!parsed.success) {
    return apiError(400, 'VALIDATION_ERROR', 'wallet is required and purpose must be login or submit.')
  }

  const { nonce, expiresAt } = await issueNonce(
    new DbNonceStore(),
    parsed.data.wallet,
    parsed.data.purpose ?? 'login',
  )
  return NextResponse.json({ nonce, expires_at: expiresAt.toISOString() })
}
