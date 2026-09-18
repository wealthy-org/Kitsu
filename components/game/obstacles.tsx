'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COIN_ROW_OFFSETS, LANE_OFFSETS, LANE_WIDTH } from '@/sim/constants'
import { laneNameToIndex, movingObstacleLaneIndex } from '@/sim/collision'
import type { RunState } from '@/sim/run'
import type { Course, CourseSegment } from '@/sim/types'

const BONE = '#ffffff'
const FROST = '#e2e2e2'
const ASH = '#b8bab9'
const CHARCOAL = '#444345'
const AMBER = '#e0a85c'
const TEAL = '#57b8ae'
const VOID = '#000000'

const TRACK_WIDTH = LANE_WIDTH * 3

function barrierHigh() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[TRACK_WIDTH * 0.95, 0.9, 0.35]} />
        <meshStandardMaterial color={FROST} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[TRACK_WIDTH * 0.95, 0.12, 0.4]} />
        <meshStandardMaterial color={BONE} roughness={0.6} />
      </mesh>
    </group>
  )
}

function barrierLow() {
  return (
    <mesh position={[0, 1.55, 0]}>
      <boxGeometry args={[TRACK_WIDTH * 0.95, 0.35, 0.35]} />
      <meshStandardMaterial color={CHARCOAL} roughness={0.9} />
    </mesh>
  )
}

function laneBlock(lane: number) {
  return (
    <mesh position={[LANE_OFFSETS[lane], 1.1, 0]}>
      <boxGeometry args={[LANE_WIDTH * 0.9, 2.2, 0.35]} />
      <meshStandardMaterial color={ASH} roughness={0.9} />
    </mesh>
  )
}

function gapVisual(width: number) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -width / 2]}>
      <planeGeometry args={[TRACK_WIDTH, width]} />
      <meshBasicMaterial color={VOID} toneMapped={false} />
    </mesh>
  )
}

const FRONT_OFFSET = 1

function CoinRow({
  lane,
  segmentIndex,
  stateRef,
}: {
  lane: number
  segmentIndex: number
  stateRef: React.RefObject<RunState>
}) {
  const coinRefs = useRef<Array<THREE.Group | null>>([])

  useFrame(() => {
    const state = stateRef.current
    COIN_ROW_OFFSETS.forEach((_, coinIndex) => {
      const group = coinRefs.current[coinIndex]
      if (!group) {
        return
      }
      const collected = state?.collectedCoins?.[`${segmentIndex}-${coinIndex}`] === true
      group.visible = !collected
      if (!collected) {
        const tick = state?.tick ?? 0
        group.rotation.y = tick * 0.06
        group.position.y = Math.sin(tick * 0.1 + coinIndex) * 0.06
      }
    })
  })

  return (
    <group position={[LANE_OFFSETS[lane], 0, 0]}>
      {COIN_ROW_OFFSETS.map((offset, coinIndex) => (
        <group
          key={offset}
          ref={(node) => {
            coinRefs.current[coinIndex] = node
          }}
          position={[0, 0, -offset - FRONT_OFFSET]}
        >
          <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.08, 16]} />
            <meshStandardMaterial color={AMBER} roughness={0.4} metalness={0.2} />
          </mesh>
        </group>
      ))}
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
    groupRef.current.rotation.z = Math.sin(tick * 0.08) * 0.15
  })
  return (
    <group ref={groupRef} position={[LANE_OFFSETS[laneNameToIndex(segment.lane ?? 'center')], 0, 0]}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[LANE_WIDTH * 0.9, 2.2, 0.35]} />
        <meshStandardMaterial color={FROST} roughness={0.9} />
      </mesh>
    </group>
  )
}

function finishLine() {
  const width = TRACK_WIDTH * 1.15
  const tiles = 16
  const tileWidth = width / tiles
  return (
    <group>
      {[-width / 2, width / 2].map((x) => (
        <mesh key={x} position={[x, 1.7, 0]}>
          <boxGeometry args={[0.16, 3.4, 0.16]} />
          <meshStandardMaterial color={TEAL} roughness={0.5} />
        </mesh>
      ))}
      {[2.75, 2.25].map((y, row) => (
        <group key={y}>
          {Array.from({ length: tiles }, (_, index) => (
            <mesh key={index} position={[-width / 2 + tileWidth * (index + 0.5), y, 0]}>
              <boxGeometry args={[tileWidth, 0.45, 0.14]} />
              <meshStandardMaterial
                color={(index + row) % 2 === 0 ? BONE : CHARCOAL}
                roughness={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[width, 0.6]} />
        <meshBasicMaterial color={AMBER} toneMapped={false} />
      </mesh>
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
      <group position={[0, 0, -course.finish_distance]}>{finishLine()}</group>
    </group>
  )
}
