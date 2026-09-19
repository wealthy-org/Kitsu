'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LANE_OFFSETS, LANE_WIDTH } from '@/sim/constants'
import { laneNameToIndex, movingObstacleLaneIndex } from '@/sim/collision'
import type { RunState } from '@/sim/run'
import type { Course, CourseSegment } from '@/sim/types'

const FROST = '#e2e2e2'
const ASH = '#94a3b8'
const AMBER = '#f59e0b'
const RED = '#ef4444'
const STRIPE = '#f1f5f9'

const TRACK_WIDTH = LANE_WIDTH * 3
const FRONT_OFFSET = 1

const BUS_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7']

function stripeBar(
  width: number,
  height: number,
  depth: number,
  y: number,
  count: number,
  colorA: string,
  colorB: string,
) {
  const stripeWidth = width / count
  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} position={[-width / 2 + stripeWidth * (index + 0.5), 0, 0]}>
          <boxGeometry args={[stripeWidth, height, depth]} />
          <meshStandardMaterial color={index % 2 === 0 ? colorA : colorB} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// Tall solid wall: the player must jump over it (PROJECT.md §1.6).
function barrierHigh() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[TRACK_WIDTH * 0.98, 0.9, 0.32]} />
        <meshStandardMaterial color="#1f2937" roughness={0.85} />
      </mesh>
      {stripeBar(TRACK_WIDTH * 0.98, 0.9, 0.36, 0.45, 12, '#f59e0b', '#111827')}
      <mesh position={[0, 1.15, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.5, 0.55, 4]} />
        <meshStandardMaterial color="#fde68a" roughness={0.6} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * TRACK_WIDTH * 0.46, 0.5, 0]}>
          <boxGeometry args={[0.16, 1.0, 0.16]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

// Elevated beam with open space underneath: the player must slide under it (PROJECT.md §1.6).
function barrierLow() {
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * TRACK_WIDTH * 0.46, 0.95, 0]}>
          <boxGeometry args={[0.18, 1.9, 0.18]} />
          <meshStandardMaterial color={ASH} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[TRACK_WIDTH * 0.98, 0.34, 0.32]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.85} />
      </mesh>
      {stripeBar(TRACK_WIDTH * 0.98, 0.34, 0.36, 1.6, 14, RED, STRIPE)}
      {[-1, 0, 1].map((slot) => (
        <mesh key={slot} position={[slot * 1.6, 1.25, 0]}>
          <coneGeometry args={[0.22, 0.36, 4]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

// City bus blocking a lane, color varies per lane.
function laneBlock(lane: number) {
  const color = BUS_COLORS[lane % BUS_COLORS.length]
  return (
    <group position={[LANE_OFFSETS[lane], 0, 0]}>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[LANE_WIDTH * 0.92, 2.0, 6]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.75, 0.1]}>
        <boxGeometry args={[LANE_WIDTH * 0.94, 0.7, 5.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.75, 2.55]}>
        <boxGeometry args={[LANE_WIDTH * 0.8, 0.7, 0.4]} />
        <meshStandardMaterial color="rgba(255,233,168,1)" transparent opacity={0.6} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * LANE_WIDTH * 0.4, 2.35, 0]} rotation={[0, 0, side * 0.2]}>
          <boxGeometry args={[0.1, 0.4, 0.4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// Damaged road section. Always blocks the full width; the deep hole sits in 1, 2, or 3 lanes.
function gapVisual(width: number, deepLanes: number) {
  const lanes = [0, 1, 2].slice(0, Math.max(1, Math.min(3, deepLanes)))
  return (
    <group position={[0, 0, -width / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[TRACK_WIDTH, width]} />
        <meshBasicMaterial color="#0a0b10" toneMapped={false} />
      </mesh>
      {[-1, 0, 1].map((lane) => (
        <mesh
          key={lane}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[LANE_OFFSETS[lane + 1], 0.03, 0]}
        >
          <planeGeometry args={[LANE_WIDTH * 0.92, width * 0.82]} />
          <meshBasicMaterial
            color={lanes.includes(lane + 1) ? '#000000' : '#2b2f38'}
            toneMapped={false}
          />
        </mesh>
      ))}
      {stripeBar(TRACK_WIDTH * 0.98, 0.3, 0.26, 0.35, 14, AMBER, '#111827')}
    </group>
  )
}

function CoinRow({
  lane,
  segmentIndex,
  stateRef,
}: {
  lane: number
  segmentIndex: number
  stateRef: React.RefObject<RunState>
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const group = groupRef.current
    if (!group) {
      return
    }
    const state = stateRef.current
    const collected = state?.collectedCoins?.[`${segmentIndex}-0`] === true
    group.visible = !collected
    if (!collected) {
      const tick = state?.tick ?? 0
      group.rotation.y = tick * 0.06
      group.position.y = Math.sin(tick * 0.1) * 0.06
    }
  })

  return (
    <group ref={groupRef} position={[LANE_OFFSETS[lane], 0, -FRONT_OFFSET]}>
      <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 16]} />
        <meshStandardMaterial color={AMBER} roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  )
}

function MovingObstacle({
  segment,
  stateRef,
}: {
  segment: CourseSegment
  stateRef: React.RefObject<RunState>
}) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!groupRef.current) {
      return
    }
    const tick = stateRef.current?.tick ?? 0
    const lane = movingObstacleLaneIndex(segment, tick)
    groupRef.current.position.x = LANE_OFFSETS[lane]
  })
  return (
    <group
      ref={groupRef}
      position={[LANE_OFFSETS[laneNameToIndex(segment.lane ?? 'center')], 0, 0]}
    >
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[LANE_WIDTH * 0.85, 1.4, 4]} />
        <meshStandardMaterial color={FROST} roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[0, 1.2, 0.1]}>
        <boxGeometry args={[LANE_WIDTH * 0.87, 0.5, 3.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} />
      </mesh>
    </group>
  )
}

// Half-3D house at the finish: the Shiba is home (PROJECT.md §1.6).
function finishHouse() {
  return (
    <group>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[5, 3, 4.4]} />
        <meshStandardMaterial color="#8a6f5a" roughness={0.9} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[0, 3.7, side * 1.15]}
          rotation={[side * 0.72, 0, 0]}
        >
          <boxGeometry args={[5.2, 0.2, 3]} />
          <meshStandardMaterial color="#5b3f35" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.0, 2.25]}>
        <boxGeometry args={[1.1, 2, 0.16]} />
        <meshStandardMaterial color="#3b2a22" roughness={0.8} />
      </mesh>
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} position={[x, 1.7, 2.25]}>
          <boxGeometry args={[1, 1, 0.14]} />
          <meshStandardMaterial color="#ffe9a8" transparent opacity={0.6} />
        </mesh>
      ))}
      {[-1, 1].map((x) => (
        <mesh key={`lamp-${x}`} position={[x * 3.4, 0.55, 2.6]}>
          <boxGeometry args={[0.12, 1.1, 0.12]} />
          <meshStandardMaterial color="#2b3245" roughness={0.8} />
        </mesh>
      ))}
      {[-1, 1].map((x) => (
        <mesh key={`glow-${x}`} position={[x * 3.4, 1.15, 2.6]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial color="#ffe9a8" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function ObstacleMesh({
  segment,
  segmentIndex,
  stateRef,
}: {
  segment: CourseSegment
  segmentIndex: number
  stateRef: React.RefObject<RunState>
}) {
  const position: [number, number, number] = [0, 0, -segment.distance]
  const deepLanes = ((segment.width ?? 2) % 3) + 1
  return (
    <group position={position}>
      {segment.type === 'barrier_high' && barrierHigh()}
      {segment.type === 'barrier_low' && barrierLow()}
      {segment.type === 'lane_block' && laneBlock(laneNameToIndex(segment.lane ?? 'center'))}
      {segment.type === 'gap' && gapVisual(segment.width ?? 2, deepLanes)}
      {segment.type === 'coin_row' && (
        <CoinRow
          lane={laneNameToIndex(segment.lane ?? 'center')}
          segmentIndex={segmentIndex}
          stateRef={stateRef}
        />
      )}
      {segment.type === 'moving_obstacle' && (
        <MovingObstacle segment={segment} stateRef={stateRef} />
      )}
    </group>
  )
}

export function Obstacles({
  course,
  stateRef,
}: {
  course: Course
  stateRef: React.RefObject<RunState>
}) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.z = stateRef.current?.distance ?? 0
    }
  })
  return (
    <group ref={groupRef}>
      {course.segments.map((segment, index) => (
        <ObstacleMesh
          key={`${segment.type}-${index}`}
          segment={segment}
          segmentIndex={index}
          stateRef={stateRef}
        />
      ))}
      <group position={[0, 0, -course.finish_distance]}>{finishHouse()}</group>
    </group>
  )
}
