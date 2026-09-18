import { NextResponse } from 'next/server'
import { getSessionWallet } from '@/lib/auth/session'
import { DbSessionStore } from '@/lib/auth/session-store'

export async function GET(request: Request) {
  try {
    const wallet = await getSessionWallet(new DbSessionStore(), request)
    return NextResponse.json({ wallet })
  } catch {
    return NextResponse.json({ wallet: null })
  }
}
