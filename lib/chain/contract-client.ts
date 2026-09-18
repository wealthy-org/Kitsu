import {
  createWalletClient,
  defineChain,
  http,
  keccak256,
  stringToHex,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import dailyCourseRegistryAbi from '@/contracts/abi/DailyCourseRegistry.json'
import verifiedRunRegistryAbi from '@/contracts/abi/VerifiedRunRegistry.json'

const robinhoodChain = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID ?? 46630),
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ?? ''] },
  },
  testnet: true,
})

function rpcUrl(): string {
  const url = process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL
  if (!url) {
    throw new Error('NEXT_PUBLIC_ROBINHOOD_RPC_URL is not set')
  }
  return url
}

function walletClient() {
  const key = process.env.RELAYER_PRIVATE_KEY
  if (!key) {
    throw new Error('RELAYER_PRIVATE_KEY is not set')
  }
  const account = privateKeyToAccount(key as Hex)
  return createWalletClient({ account, chain: robinhoodChain, transport: http(rpcUrl()) })
}

function requireAddress(value: string | undefined, name: string): Hex {
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value as Hex
}

export function courseIdOf(courseDate: string): Hex {
  return keccak256(stringToHex(courseDate))
}

export function runIdOf(runId: string): Hex {
  return keccak256(stringToHex(runId))
}

export async function publishCourseOnChain(courseDate: string, seed: string): Promise<Hex> {
  const address = requireAddress(
    process.env.NEXT_PUBLIC_DAILY_COURSE_REGISTRY_ADDRESS,
    'NEXT_PUBLIC_DAILY_COURSE_REGISTRY_ADDRESS',
  )
  return walletClient().writeContract({
    address,
    abi: dailyCourseRegistryAbi,
    functionName: 'publishCourse',
    args: [courseIdOf(courseDate), seed],
  })
}

export async function relayRunOnChain(params: {
  runId: string
  wallet: string
  courseDate: string
  score: number
  timestamp: number
}): Promise<Hex> {
  const address = requireAddress(
    process.env.NEXT_PUBLIC_VERIFIED_RUN_REGISTRY_ADDRESS,
    'NEXT_PUBLIC_VERIFIED_RUN_REGISTRY_ADDRESS',
  )
  return walletClient().writeContract({
    address,
    abi: verifiedRunRegistryAbi,
    functionName: 'relayRun',
    args: [
      runIdOf(params.runId),
      params.wallet as Hex,
      courseIdOf(params.courseDate),
      BigInt(Math.round(params.score)),
      BigInt(params.timestamp),
    ],
  })
}
