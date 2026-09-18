import { verifyMessage } from 'viem'

export function buildRunNonceMessage(wallet: string, nonce: string): string {
  return ['Kitsu run submission', `wallet: ${wallet.toLowerCase()}`, `nonce: ${nonce}`].join('\n')
}

export async function verifyRunNonceSignature(
  wallet: string,
  nonce: string,
  signature: string,
): Promise<boolean> {
  try {
    return await verifyMessage({
      address: wallet as `0x${string}`,
      message: buildRunNonceMessage(wallet, nonce),
      signature: signature as `0x${string}`,
    })
  } catch {
    return false
  }
}
