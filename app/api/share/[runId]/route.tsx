import { ImageResponse } from '@vercel/og'
import { apiError } from '@/lib/http/error'
import { getRunById } from '@/lib/repositories/run.repository'
import { formatTime, shortenAddress } from '@/lib/util/format'

export const runtime = 'nodejs'

async function loadAssetDataUrl(request: Request, path: string): Promise<string | null> {
  try {
    const response = await fetch(new URL(path, request.url))
    if (!response.ok) {
      return null
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    const type = response.headers.get('content-type') ?? 'image/png'
    return `data:${type};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

export async function GET(request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params
  const run = await getRunById(runId)
  if (!run) {
    return apiError(404, 'RUN_NOT_FOUND', 'Run does not exist.')
  }

  const time = run.verifiedTimeMs === null ? 'not verified' : formatTime(run.verifiedTimeMs)
  const points = run.verifiedScore === null ? '-' : String(Number(run.verifiedScore))

  const [background, logo] = await Promise.all([
    loadAssetDataUrl(request, '/share/background.png'),
    loadAssetDataUrl(request, '/share/logo.png'),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: '#020617',
          color: '#ffffff',
        }}
      >
        {background !== null && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={background}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              objectFit: 'cover',
            }}
          />
        )}

        {/* Right side: Kitsu brand logo with "KITSU" wordmark underneath */}
        {logo !== null && (
          <div
            style={{
              position: 'absolute',
              right: 80,
              top: 0,
              bottom: 0,
              width: 380,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt=""
              width={260}
              height={260}
              style={{
                width: 260,
                height: 260,
              }}
            />
            <div
              style={{
                display: 'flex',
                fontSize: 48,
                letterSpacing: 10,
                color: '#f1f5f9',
                marginTop: 18,
                fontWeight: 700,
              }}
            >
              KITSU
            </div>
          </div>
        )}

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 24,
                letterSpacing: 4,
                color: '#38bdf8',
                fontWeight: 600,
              }}
            >
              VERIFIED RUN
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: 104, marginTop: 24 }}>{time}</div>
          <div style={{ display: 'flex', fontSize: 34, marginTop: 12, color: '#38bdf8' }}>
            {run.status}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 'auto',
              fontSize: 26,
              color: '#b8bab9',
              maxWidth: 620,
            }}
          >
            <span>{run.courseDate}</span>
            <span>{shortenAddress(run.walletAddress)}</span>
            <span style={{ color: '#f59e0b' }}>points {points}</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
