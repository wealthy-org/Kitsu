'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LANE_OFFSETS, LANE_WIDTH } from '@/sim/constants'
import { laneNameToIndex, movingObstacleLaneIndex } from '@/sim/collision'
import type { RunState } from '@/sim/run'
import type { Course, CourseSegment } from '@/sim/types'

const FROST = '#e2e2e2'
const AMBER = '#f59e0b'

const TRACK_WIDTH = LANE_WIDTH * 3
const FRONT_OFFSET = 0

// The engine collides at the obstacle's anchor point. Deep meshes are centred on that anchor, so
// shift them forward by half their depth to land their leading face exactly on the collision plane.
function visualOffset(segment: CourseSegment): number {
  if (segment.type === 'barrier_high' || segment.type === 'barrier_low') {
    return -0.18
  }
  if (segment.type === 'lane_block') {
    return -3
  }
  if (segment.type === 'moving_obstacle') {
    return -2
  }
  return 0
}

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

// Tall solid wall: the player must jump over it (PROJECT.md §1.6). The panel is solid, so it
// cannot read as a slide opening.
function barrierHigh() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[TRACK_WIDTH * 0.98, 0.9, 0.32]} />
        <meshStandardMaterial color="#1f2937" roughness={0.85} />
      </mesh>
      {stripeBar(TRACK_WIDTH * 0.98, 0.9, 0.36, 0.45, 12, '#f59e0b', '#111827')}
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
          <meshStandardMaterial color="#94a3b8" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[TRACK_WIDTH * 0.98, 0.34, 0.32]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.85} />
      </mesh>
      {stripeBar(TRACK_WIDTH * 0.98, 0.34, 0.36, 1.6, 14, '#ef4444', '#f1f5f9')}
    </group>
  )
}

// City bus blocking a lane. The front faces the player (+Z): windshield, destination sign, and
// headlights sit just outside the body so nothing z-fights.
function laneBlock(lane: number) {
  const color = BUS_COLORS[lane % BUS_COLORS.length]
  return (
    <group position={[LANE_OFFSETS[lane], 0, 0]}>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[LANE_WIDTH * 0.92, 2.0, 6]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.75, 3.03]}>
        <boxGeometry args={[LANE_WIDTH * 0.83, 0.85, 0.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} />
      </mesh>
      <mesh position={[0, 2.45, 3.06]}>
        <boxGeometry args={[LANE_WIDTH * 0.6, 0.3, 0.08]} />
        <meshStandardMaterial color="#fde68a" roughness={0.6} />
      </mesh>
      {[-0.6, 0.6].map((x) => (
        <mesh key={`headlight-${x}`} position={[x, 0.8, 3.06]}>
          <boxGeometry args={[0.3, 0.2, 0.08]} />
          <meshStandardMaterial color="#fff7cc" roughness={0.4} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`side-window-${side}`} position={[side * LANE_WIDTH * 0.47, 1.8, 0]}>
          <boxGeometry args={[0.06, 0.7, 4.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 2.35, -0.6]}>
        <boxGeometry args={[LANE_WIDTH * 0.7, 0.2, 2.2]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      {[-2, 2].map((z) =>
        [-1, 1].map((side) => (
          <mesh
            key={`wheel-${z}-${side}`}
            position={[side * LANE_WIDTH * 0.46, 0.42, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.42, 0.42, 0.24, 12]} />
            <meshStandardMaterial color="#111827" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  )
}

// Broken road (pothole) section: one rough asphalt patch with a little rubble. Always blocks the
// full width. The engine treats it as the PROJECT.md gap.
function gapVisual(width: number) {
  return (
    <group position={[0, 0, -width / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[TRACK_WIDTH, width]} />
        <meshStandardMaterial color="#161a20" roughness={1} />
      </mesh>
      {[-1.6, 0, 1.6].map((x, index) => (
        <mesh
          key={`rubble-${x}`}
          position={[x, 0.1, (index - 1) * 0.6]}
          rotation={[0.3, index * 0.7, 0.2]}
        >
          <boxGeometry args={[0.4, 0.18, 0.5]} />
          <meshStandardMaterial color="#3b3f49" roughness={1} />
        </mesh>
      ))}
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
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[LANE_WIDTH * 0.8, 0.8, 3.6]} />
        <meshStandardMaterial color={FROST} roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[0, 1.3, -0.35]}>
        <boxGeometry args={[LANE_WIDTH * 0.7, 0.6, 1.7]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.25, 0.52]}>
        <boxGeometry args={[LANE_WIDTH * 0.62, 0.5, 0.08]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={`car-headlight-${x}`} position={[x, 0.7, 1.84]}>
          <boxGeometry args={[0.28, 0.16, 0.08]} />
          <meshStandardMaterial color="#fff7cc" roughness={0.4} />
        </mesh>
      ))}
      {[1.15, -1.15].map((z) =>
        [-1, 1].map((side) => (
          <mesh
            key={`car-wheel-${z}-${side}`}
            position={[side * LANE_WIDTH * 0.36, 0.32, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.32, 0.32, 0.2, 12]} />
            <meshStandardMaterial color="#0b0f1a" roughness={0.9} />
          </mesh>
        )),
      )}
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
  const position: [number, number, number] = [0, 0, -segment.distance + visualOffset(segment)]
  return (
    <group position={position}>
      {segment.type === 'barrier_high' && barrierHigh()}
      {segment.type === 'barrier_low' && barrierLow()}
      {segment.type === 'lane_block' && laneBlock(laneNameToIndex(segment.lane ?? 'center'))}
      {segment.type === 'gap' && gapVisual(segment.width ?? 2)}
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
      <group position={[0, 0, -course.finish_distance - 2.2]}>{finishHouse()}</group>
    </group>
  )
}
