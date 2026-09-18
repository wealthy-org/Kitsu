'use client'

import { useState } from 'react'
import { SiweMessage } from 'siwe'
import { useAccount, useChainId, useConnect, useDisconnect, useSignMessage, useSwitchChain } from 'wagmi'
import { robinhoodTestnet } from '@/lib/wallet/wagmi'

type SignInStatus = 'idle' | 'signing' | 'signed-in' | 'error'

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletPanel({ onSignedIn }: { onSignedIn?: () => void }) {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: connecting, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { signMessageAsync } = useSignMessage()
  const [status, setStatus] = useState<SignInStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const wrongNetwork = isConnected && chainId !== robinhoodTestnet.id
  const connector = connectors[0]

  async function signIn() {
    if (!address) {
      return
    }
    setStatus('signing')
    setMessage(null)
    try {
      const nonceResponse = await fetch(`/api/wallet/nonce?wallet=${address}`)
      if (!nonceResponse.ok) {
        throw new Error('nonce')
      }
      const { nonce } = (await nonceResponse.json()) as { nonce: string }
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Kitsu',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      })
      const prepared = siweMessage.prepareMessage()
      const signature = await signMessageAsync({ message: prepared })
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, message: prepared, signature }),
      })
      if (!response.ok) {
        const body = (await response.json()) as { error?: { message?: string } }
        setStatus('error')
        setMessage(body.error?.message ?? 'Sign-in failed.')
        return
      }
      setStatus('signed-in')
      setMessage('Signed in. Your session is active.')
      onSignedIn?.()
    } catch {
      setStatus('error')
      setMessage('Sign-in was rejected or failed. Please try again.')
    }
  }

  return (
    <section className="rounded-card border border-frost/15 bg-void/70 p-6">
      <h2 className="font-display text-[26px] leading-none text-bone">Wallet</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ash">
        Connect Phantom (EVM) and sign a message to prove wallet ownership. The wallet is required
        only for official submissions; practice stays wallet-free.
      </p>

      {!isConnected && (
        <div className="mt-5">
          <button
            type="button"
            disabled={connecting || !connector}
            onClick={() => {
              if (connector) {
                connect({ connector })
              }
            }}
            className="inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber disabled:opacity-50"
          >
            Connect wallet
          </button>
          {!connector && (
            <p className="mt-3 text-[13px] text-error">
              No compatible wallet found. Install the Phantom extension and reload.
            </p>
          )}
          {connectError && connector && (
            <p className="mt-3 text-[13px] text-error">
              Connection was rejected or failed. Please try again.
            </p>
          )}
        </div>
      )}

      {isConnected && (
        <div className="mt-5 space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[-0.02em] text-frost">
            {address ? shortenAddress(address) : ''}
          </p>

          {wrongNetwork ? (
            <div>
              <p className="text-[13px] text-error">
                Wrong network. Switch to {robinhoodTestnet.name}.
              </p>
              <button
                type="button"
                disabled={switching}
                onClick={() => switchChain({ chainId: robinhoodTestnet.id })}
                className="mt-3 inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber disabled:opacity-50"
              >
                Switch network
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={status === 'signing'}
                onClick={signIn}
                className="inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber disabled:opacity-50"
              >
                {status === 'signed-in' ? 'Sign in again' : 'Sign in with Ethereum'}
              </button>
              <button
                type="button"
                onClick={() => {
                  disconnect()
                  setStatus('idle')
                  setMessage(null)
                }}
                className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
              >
                Disconnect
              </button>
            </div>
          )}

          {message && (
            <p
              className={`text-[13px] ${status === 'error' ? 'text-error' : 'text-accent-teal'}`}
              role="status"
            >
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
