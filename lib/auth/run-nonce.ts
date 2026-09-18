import { verifyMessage } from 'viem'
import { buildRunNonceMessage } from './run-nonce-message'

export { buildRunNonceMessage } from './run-nonce-message'

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
