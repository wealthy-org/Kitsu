interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>
}

function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') {
    return null
  }
  const candidate = (window as unknown as { ethereum?: Eip1193Provider }).ethereum
  return candidate ?? null
}

function toHexMessage(message: string): string {
  return `0x${Array.from(new TextEncoder().encode(message))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}`
}

function messageOf(error: unknown): string {
  if (error && typeof error === 'object') {
    const candidate = error as { shortMessage?: string; message?: string }
    return candidate.shortMessage ?? candidate.message ?? String(error)
  }
  return String(error)
}

export async function signMessageWithFallback(
  message: string,
  address: string,
  signMessageAsync: (args: { message: string }) => Promise<string>,
): Promise<string> {
  const provider = getInjectedProvider()
  if (!provider) {
    return signMessageAsync({ message })
  }

  const hex = toHexMessage(message)
  const attempts: unknown[][] = [
    [hex, address],
    [hex, address, ''],
    [message, address],
    [address, hex],
  ]
  const errors: string[] = []

  for (const params of attempts) {
    try {
      const result = await provider.request({ method: 'personal_sign', params })
      if (typeof result === 'string' && result.startsWith('0x')) {
        return result
      }
      errors.push(`personal_sign ${JSON.stringify(params).slice(0, 60)}: unexpected result`)
    } catch (error) {
      errors.push(`personal_sign ${JSON.stringify(params).slice(0, 60)}: ${messageOf(error)}`)
    }
  }

  try {
    return await signMessageAsync({ message })
  } catch (error) {
    errors.push(`viem signMessage: ${messageOf(error)}`)
  }

  throw new Error(`Wallet signing failed. ${errors.join(' | ')}`)
}
