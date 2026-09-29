import { NextResponse } from 'next/server'

export function apiError(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json(
    { error: { code, message, details: {} } },
    headers ? { status, headers } : { status },
  )
}
