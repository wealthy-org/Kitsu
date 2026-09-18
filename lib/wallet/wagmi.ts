import { defineChain } from 'viem'
import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'

export const robinhoodTestnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID ?? 46630),
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ?? ''] },
  },
  testnet: true,
})

export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet],
  connectors: [injected()],
  transports: {
    [robinhoodTestnet.id]: http(),
  },
  ssr: true,
})
