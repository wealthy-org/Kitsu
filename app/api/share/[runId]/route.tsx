import { ImageResponse } from 'next/og'
import { apiError } from '@/lib/http/error'
import { getRunById } from '@/lib/repositories/run.repository'
import { formatTime, shortenAddress } from '@/lib/util/format'

export async function GET(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  const { runId } = await context.params
  const run = await getRunById(runId)
  if (!run) {
    return apiError(404, 'RUN_NOT_FOUND', 'Run does not exist.')
  }

  const time = run.verifiedTimeMs === null ? 'not verified' : formatTime(run.verifiedTimeMs)
  const score = run.verifiedScore === null ? '-' : String(Number(run.verifiedScore))

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#000000',
          color: '#ffffff',
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 4, color: '#b8bab9' }}>
          KITSU
        </div>
        <div style={{ display: 'flex', fontSize: 104, marginTop: 24 }}>{time}</div>
        <div style={{ display: 'flex', fontSize: 34, marginTop: 12, color: '#57b8ae' }}>
          {run.status}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'auto',
            fontSize: 26,
            color: '#b8bab9',
          }}
        >
          <span>{run.courseDate}</span>
          <span>{shortenAddress(run.walletAddress)}</span>
          <span style={{ color: '#e0a85c' }}>coins {score}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
