'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LANE_OFFSETS, LANE_WIDTH } from '@/sim/constants'
import { laneNameToIndex, movingObstacleLaneIndex } from '@/sim/collision'
import type { RunState } from '@/sim/run'
import type { Course, CourseSegment } from '@/sim/types'

const BONE = '#ffffff'
const FROST = '#e2e2e2'
const ASH = '#b8bab9'
const CHARCOAL = '#444345'
const AMBER = '#e0a85c'
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, width / 2]}>
      <planeGeometry args={[TRACK_WIDTH, width]} />
      <meshBasicMaterial color={VOID} toneMapped={false} />
    </mesh>
  )
}

function coinRow(lane: number) {
  return (
    <group position={[LANE_OFFSETS[lane], 0, 0]}>
      {[-1.2, 0, 1.2].map((offset) => (
        <mesh key={offset} position={[0, 0.7, offset]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.08, 16]} />
          <meshStandardMaterial color={AMBER} roughness={0.4} metalness={0.2} />
        </mesh>
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

function ObstacleMesh({
  segment,
  stateRef,
}: {
  segment: CourseSegment
  stateRef: React.RefObject<RunState>
}) {
  const position: [number, number, number] = [0, 0, -segment.distance]
  return (
    <group position={position}>
      {segment.type === 'barrier_high' && barrierHigh()}
      {segment.type === 'barrier_low' && barrierLow()}
      {segment.type === 'lane_block' && laneBlock(laneNameToIndex(segment.lane ?? 'center'))}
      {segment.type === 'gap' && gapVisual(segment.width ?? 2)}
      {segment.type === 'coin_row' && coinRow(laneNameToIndex(segment.lane ?? 'center'))}
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
        <ObstacleMesh key={`${segment.type}-${index}`} segment={segment} stateRef={stateRef} />
      ))}
    </group>
  )
}
