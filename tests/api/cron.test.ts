import { beforeEach, describe, expect, it } from 'vitest'
import { POST as publishCourse } from '@/app/api/cron/publish-course/route'
import { POST as relayRuns } from '@/app/api/cron/relay-runs/route'

function request(headers?: Record<string, string>): Request {
  return new Request('http://localhost/api/cron', { method: 'POST', headers })
}

describe('cron endpoints (smoke)', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'cron-secret-value'
  })

  it('rejects publish-course without a secret', async () => {
    const response = await publishCourse(request())
    expect(response.status).toBe(401)
  })

  it('rejects publish-course with a wrong secret', async () => {
    const response = await publishCourse(request({ authorization: 'Bearer nope' }))
    expect(response.status).toBe(401)
  })

  it('rejects relay-runs without a secret', async () => {
    const response = await relayRuns(request())
    expect(response.status).toBe(401)
  })

  it('rejects relay-runs with a wrong secret', async () => {
    const response = await relayRuns(request({ authorization: 'Bearer nope' }))
    expect(response.status).toBe(401)
  })
})
