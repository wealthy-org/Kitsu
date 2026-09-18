import { SiweMessage } from 'siwe'

export interface SiweVerifyInput {
  message: string
  signature: string
  nonce: string
}

export interface SiweVerifyResult {
  address: string
}

export function parseSiweNonce(message: string): string | null {
  try {
    return new SiweMessage(message).nonce
  } catch {
    return null
  }
}

export async function verifySiweMessage(
  input: SiweVerifyInput,
): Promise<SiweVerifyResult | null> {
  try {
    const message = new SiweMessage(input.message)
    const result = await message.verify({ signature: input.signature, nonce: input.nonce })
    if (!result.success) {
      return null
    }
    return { address: message.address }
  } catch {
    return null
  }
}
