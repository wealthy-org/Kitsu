import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

interface AbiEntry {
  type: string
  name?: string
}

function readAbi(name: string): AbiEntry[] {
  const path = join(process.cwd(), 'contracts', 'abi', `${name}.json`)
  return JSON.parse(readFileSync(path, 'utf8')) as AbiEntry[]
}

function functionNames(abi: AbiEntry[]): string[] {
  return abi.filter((entry) => entry.type === 'function').map((entry) => entry.name ?? '')
}

const CONTRACTS = ['DailyCourseRegistry', 'VerifiedRunRegistry', 'SeasonPrizeVault']

describe('solidity contracts', () => {
  it('exposes the expected functions', () => {
    expect(functionNames(readAbi('DailyCourseRegistry'))).toEqual(
      expect.arrayContaining(['publishCourse', 'getSeedHash', 'published', 'owner']),
    )
    expect(functionNames(readAbi('VerifiedRunRegistry'))).toEqual(
      expect.arrayContaining(['relayRun', 'relayed', 'courseRegistry', 'owner']),
    )
    expect(functionNames(readAbi('SeasonPrizeVault'))).toEqual(
      expect.arrayContaining(['fund', 'distribute', 'balance', 'owner']),
    )
  })

  it('keeps course publishing out of VerifiedRunRegistry', () => {
    expect(functionNames(readAbi('VerifiedRunRegistry'))).not.toContain('publishCourse')
  })

  it('has compiled bytecode when artifacts exist', () => {
    const artifactsDir = join(process.cwd(), 'contracts', 'artifacts')
    if (!existsSync(artifactsDir)) {
      return
    }
    for (const name of CONTRACTS) {
      const path = join(artifactsDir, `${name}.bin`)
      expect(existsSync(path)).toBe(true)
      expect(readFileSync(path, 'utf8').length).toBeGreaterThan(0)
    }
  })
})
