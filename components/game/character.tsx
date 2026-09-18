'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { JUMP_TICKS, LANE_OFFSETS, LANE_SWITCH_TICKS } from '@/sim/constants'
import type { RunState } from '@/sim/run'

const BODY = '#e0a85c'
const CREAM = '#e2e2e2'
const DARK = '#444345'
const COLLAR = '#57b8ae'
const JUMP_HEIGHT = 1.4

export function Character({ stateRef }: { stateRef: React.RefObject<RunState> }) {
  const rootRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const legRefs = useRef<Array<THREE.Mesh | null>>([])
  const tailRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const state = stateRef.current
    if (!state || !rootRef.current || !bodyRef.current) {
      return
    }

    let laneX = LANE_OFFSETS[state.laneIndex]
    if (state.laneSwitchRemaining > 0) {
      const progress = 1 - state.laneSwitchRemaining / LANE_SWITCH_TICKS
      const from = LANE_OFFSETS[state.laneIndex]
      const to = LANE_OFFSETS[state.laneTarget]
      laneX = from + (to - from) * progress
    }

    const airborne = state.tick < state.airborneUntil
    const sliding = state.tick < state.slidingUntil
    let height = 0
    if (airborne) {
      const elapsed = state.tick - (state.airborneUntil - JUMP_TICKS)
      const progress = Math.min(1, Math.max(0, elapsed / JUMP_TICKS))
      height = Math.sin(Math.PI * progress) * JUMP_HEIGHT
    }

    rootRef.current.position.x = laneX
    rootRef.current.position.y = height

    const body = bodyRef.current
    if (sliding) {
      body.rotation.x = -1.1
      body.position.y = 0.15
    } else if (airborne) {
      body.rotation.x = 0.25
      body.position.y = 0.35
    } else if (state.status === 'failed') {
      body.rotation.x = 1.2
      body.position.y = 0.3
    } else {
      body.rotation.x = 0
      body.position.y = 0.35 + Math.sin(state.tick * 0.3) * 0.03
    }

    if (headRef.current) {
      headRef.current.rotation.z =
        sliding || airborne ? 0 : Math.sin(state.tick * 0.3) * 0.05
    }

    const moving = state.status === 'running' && !sliding
    legRefs.current.forEach((leg, index) => {
      if (!leg) {
        return
      }
      if (sliding) {
        leg.rotation.x = 1.2
      } else if (airborne) {
        leg.rotation.x = 0.9
      } else if (moving) {
        const phase = state.tick * 0.45 + (index % 2 === 0 ? 0 : Math.PI)
        leg.rotation.x = Math.sin(phase) * 0.7
      } else {
        leg.rotation.x = 0
      }
    })

    if (tailRef.current) {
      tailRef.current.rotation.x = -0.6 + Math.sin(state.tick * 0.5) * 0.2
    }
  })

  return (
    <group ref={rootRef} position={[0, 0, 0]}>
      <group ref={bodyRef} position={[0, 0.35, 0]}>
        <mesh>
          <boxGeometry args={[0.7, 0.55, 1.15]} />
          <meshStandardMaterial color={BODY} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry args={[0.62, 0.35, 1.0]} />
          <meshStandardMaterial color={CREAM} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.02, 0.62]}>
          <boxGeometry args={[0.72, 0.16, 0.1]} />
          <meshStandardMaterial color={COLLAR} roughness={0.6} />
        </mesh>

        <group ref={headRef} position={[0, 0.32, 0.72]}>
          <mesh>
            <boxGeometry args={[0.62, 0.55, 0.6]} />
            <meshStandardMaterial color={BODY} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.12, 0.32]}>
            <boxGeometry args={[0.38, 0.3, 0.3]} />
            <meshStandardMaterial color={CREAM} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.08, 0.48]}>
            <boxGeometry args={[0.16, 0.12, 0.1]} />
            <meshStandardMaterial color={DARK} roughness={0.5} />
          </mesh>
          <mesh position={[-0.15, 0.16, 0.3]}>
            <boxGeometry args={[0.1, 0.12, 0.08]} />
            <meshStandardMaterial color={DARK} roughness={0.4} />
          </mesh>
          <mesh position={[0.15, 0.16, 0.3]}>
            <boxGeometry args={[0.1, 0.12, 0.08]} />
            <meshStandardMaterial color={DARK} roughness={0.4} />
          </mesh>
          <mesh position={[-0.28, 0.4, -0.05]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.18, 0.32, 0.12]} />
            <meshStandardMaterial color={BODY} roughness={0.85} />
          </mesh>
          <mesh position={[0.28, 0.4, -0.05]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.18, 0.32, 0.12]} />
            <meshStandardMaterial color={BODY} roughness={0.85} />
          </mesh>
        </group>

        <mesh ref={tailRef} position={[0, 0.2, -0.62]} rotation={[-0.6, 0, 0]}>
          <boxGeometry args={[0.16, 0.16, 0.5]} />
          <meshStandardMaterial color={BODY} roughness={0.85} />
        </mesh>

        {[
          [-0.24, 0.3],
          [0.24, 0.3],
          [-0.24, -0.32],
          [0.24, -0.32],
        ].map(([x, z], index) => (
          <mesh
            key={`${x}-${z}`}
            ref={(node) => {
              legRefs.current[index] = node
            }}
            position={[x, -0.4, z]}
          >
            <boxGeometry args={[0.16, 0.55, 0.16]} />
            <meshStandardMaterial color={CREAM} roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
