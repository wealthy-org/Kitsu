export function buildRunNonceMessage(wallet: string, nonce: string): string {
  return ['Kitsu run submission', `wallet: ${wallet.toLowerCase()}`, `nonce: ${nonce}`].join('\n')
}
