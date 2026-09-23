'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LANE_OFFSETS, LANE_WIDTH } from '@/sim/constants'
import { laneNameToIndex, movingObstacleLaneIndex } from '@/sim/collision'
import type { RunState } from '@/sim/run'
import type { Course, CourseSegment } from '@/sim/types'

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

// Tall solid barrier: the player must jump over it (PROJECT.md §1.6).
function barrierHigh() {
  return (
    <group>
      {/* Heavy base frame */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[TRACK_WIDTH * 0.98, 0.9, 0.32]} />
        <meshStandardMaterial color="#111827" roughness={0.85} />
      </mesh>
      {/* High-visibility diagonal hazard stripes */}
      {stripeBar(TRACK_WIDTH * 0.98, 0.88, 0.36, 0.45, 14, '#f59e0b', '#0f172a')}
      {/* Reinforced vertical posts with glowing hazard beacon lights */}
      {[-1, 1].map((side) => (
        <group key={`post-${side}`} position={[side * TRACK_WIDTH * 0.47, 0, 0]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.2, 1.1, 0.2]} />
            <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* Glowing amber beacon strobe */}
          <mesh position={[0, 1.15, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.18, 12]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#f59e0b"
              emissiveIntensity={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Elevated gantry beam with generous open space underneath: player must slide under it (PROJECT.md §1.6).
// No downward arrows per user directive; clean hazard beam with overhead clearance guide.
function barrierLow() {
  return (
    <group>
      {/* Tall roadside support trusses */}
      {[-1, 1].map((side) => (
        <group key={`truss-${side}`} position={[side * TRACK_WIDTH * 0.48, 0, 0]}>
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[0.22, 2.2, 0.22]} />
            <meshStandardMaterial color="#1f2937" roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Overhead barrier body at y = 1.65m (leaves 0 to 1.45m completely clear for sliding) */}
      <mesh position={[0, 1.68, 0]}>
        <boxGeometry args={[TRACK_WIDTH * 0.98, 0.42, 0.34]} />
        <meshStandardMaterial color="#18181b" roughness={0.8} />
      </mesh>
      {/* Hazard stripe fascia on the overhead beam */}
      {stripeBar(TRACK_WIDTH * 0.98, 0.4, 0.38, 1.68, 16, '#ef4444', '#f8fafc')}
      {/* Horizontal bottom clearance LED strip (guides runner's eye) */}
      <mesh position={[0, 1.46, 0.19]}>
        <boxGeometry args={[TRACK_WIDTH * 0.96, 0.05, 0.04]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.85}
          roughness={0.2}
        />
      </mesh>
    </group>
  )
}

// Tokyo city transit bus blocking a lane. Aerodynamic front, route display, glowing headlights.
function laneBlock(lane: number) {
  const color = BUS_COLORS[lane % BUS_COLORS.length]
  return (
    <group position={[LANE_OFFSETS[lane], 0, 0]}>
      {/* Main Bus Body */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[LANE_WIDTH * 0.92, 2.0, 6]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Contrast accent trim strip */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[LANE_WIDTH * 0.94, 0.22, 6.02]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 1.78, 3.02]}>
        <boxGeometry args={[LANE_WIDTH * 0.84, 0.8, 0.08]} />
        <meshStandardMaterial color="#090d16" roughness={0.15} metalness={0.8} />
      </mesh>
      {/* Digital LED Route Destination Board ("KITSU LINE") */}
      <mesh position={[0, 2.42, 3.05]}>
        <boxGeometry args={[LANE_WIDTH * 0.65, 0.25, 0.08]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#d97706"
          emissiveIntensity={0.9}
          roughness={0.3}
        />
      </mesh>
      {/* Glowing Dual LED Headlights */}
      {[-0.65, 0.65].map((x) => (
        <mesh key={`headlight-${x}`} position={[x, 0.65, 3.04]}>
          <boxGeometry args={[0.34, 0.2, 0.08]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#fef08a"
            emissiveIntensity={0.95}
            roughness={0.2}
          />
        </mesh>
      ))}
      {/* Side Passenger Windows */}
      {[-1, 1].map((side) => (
        <mesh key={`side-window-${side}`} position={[side * LANE_WIDTH * 0.47, 1.78, 0]}>
          <boxGeometry args={[0.06, 0.72, 4.6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.7} />
        </mesh>
      ))}
      {/* Roof air conditioner unit */}
      <mesh position={[0, 2.36, -0.6]}>
        <boxGeometry args={[LANE_WIDTH * 0.65, 0.22, 2.4]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      {/* Wheels with dark rubber and rim hubcaps */}
      {[-2, 2].map((z) =>
        [-1, 1].map((side) => (
          <group key={`wheel-${z}-${side}`} position={[side * LANE_WIDTH * 0.46, 0.42, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.42, 0.42, 0.24, 14]} />
              <meshStandardMaterial color="#090d16" roughness={0.9} />
            </mesh>
            <mesh position={[side * 0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.02, 10]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.6} />
            </mesh>
          </group>
        )),
      )}
    </group>
  )
}

// Broken road / pothole chasm with jagged asphalt and roadside hazard markers. Always blocks full width.
function gapVisual(width: number) {
  return (
    <group position={[0, 0, -width / 2]}>
      {/* Dark chasm pit beneath track */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[TRACK_WIDTH, width]} />
        <meshStandardMaterial color="#020408" roughness={1} />
      </mesh>
      {/* Fractured jagged road slabs */}
      {[-2, -0.7, 0.7, 2].map((x, index) => (
        <mesh
          key={`slab-${x}`}
          position={[x, 0.02, (index % 2 === 0 ? -1 : 1) * (width * 0.25)]}
          rotation={[0.08, index * 0.6, 0.04]}
        >
          <boxGeometry args={[1.1, 0.14, width * 0.45]} />
          <meshStandardMaterial color="#1f242d" roughness={0.95} />
        </mesh>
      ))}
      {/* Roadside warning cones at fissure edges */}
      {[-1, 1].map((side) => (
        <group key={`cone-${side}`} position={[side * (TRACK_WIDTH / 2 - 0.2), 0, 0]}>
          <mesh position={[0, 0.28, 0]}>
            <coneGeometry args={[0.18, 0.55, 12]} />
            <meshStandardMaterial
              color="#f97316"
              emissive="#ea580c"
              emissiveIntensity={0.6}
              roughness={0.4}
            />
          </mesh>
          {/* Reflective cone collar */}
          <mesh position={[0, 0.24, 0]}>
            <coneGeometry args={[0.13, 0.14, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Shiba Paw Arcade Coin: golden beveled coin with raised paw insignia and warm metallic sheen.
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
      group.rotation.y = tick * 0.07
      group.position.y = Math.sin(tick * 0.12) * 0.08
    }
  })

  return (
    <group ref={groupRef} position={[LANE_OFFSETS[lane], 0, -FRONT_OFFSET]}>
      <group position={[0, 0.75, 0]}>
        {/* Main Coin Disc */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.08, 20]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#d97706"
            emissiveIntensity={0.4}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        {/* Raised Beveled Rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.04, 20]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#b45309"
            emissiveIntensity={0.4}
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
        {/* Shiba Paw Center Pad (Front & Back) */}
        {[-0.042, 0.042].map((z) => (
          <group key={`paw-${z}`} position={[0, 0, z]}>
            {/* Main palm pad */}
            <mesh position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.015, 12]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.3} metalness={0.5} />
            </mesh>
            {/* 3 Toe pads */}
            {[-0.09, 0, 0.09].map((tx, idx) => (
              <mesh key={`toe-${idx}`} position={[tx, 0.08 + (idx === 1 ? 0.03 : 0), 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.015, 8]} />
                <meshStandardMaterial color="#fef3c7" roughness={0.3} metalness={0.5} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  )
}

// Dynamic compact car shifting lanes with glowing headlights and turn blinkers.
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
      {/* Car Body Chassis */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[LANE_WIDTH * 0.82, 0.78, 3.8]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Cabin Roof & Windows */}
      <mesh position={[0, 1.28, -0.3]}>
        <boxGeometry args={[LANE_WIDTH * 0.72, 0.58, 1.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Glowing Dual Headlights */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={`car-headlight-${x}`} position={[x, 0.65, 1.92]}>
          <boxGeometry args={[0.26, 0.16, 0.06]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#fef08a"
            emissiveIntensity={0.95}
            roughness={0.2}
          />
        </mesh>
      ))}
      {/* Amber Directional Indicators / Blinkers */}
      {[-1, 1].map((side) => (
        <mesh
          key={`blinker-${side}`}
          position={[side * (LANE_WIDTH * 0.42), 0.68, 1.8]}
        >
          <boxGeometry args={[0.06, 0.12, 0.22]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#d97706"
            emissiveIntensity={0.8}
            roughness={0.3}
          />
        </mesh>
      ))}
      {/* Rear Taillights */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={`car-taillight-${x}`} position={[x, 0.65, -1.92]}>
          <boxGeometry args={[0.26, 0.14, 0.06]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#dc2626"
            emissiveIntensity={0.85}
            roughness={0.3}
          />
        </mesh>
      ))}
      {/* 4 Wheels */}
      {[1.15, -1.15].map((z) =>
        [-1, 1].map((side) => (
          <mesh
            key={`car-wheel-${z}-${side}`}
            position={[side * LANE_WIDTH * 0.38, 0.34, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.34, 0.34, 0.22, 14]} />
            <meshStandardMaterial color="#090d16" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  )
}

// Finish Landmark: Option C — Neo-Tokyo Cube House.
// Contemporary geometric modernist cube architecture with warm corner ribbon window,
// entrance canopy, digital house number (#01), and floating roof LED trim.
function finishHouse() {
  return (
    <group>
      {/* Ground Floor Main Pavilion Cube */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[6.2, 3.6, 5.2]} />
        <meshStandardMaterial color="#1a202c" roughness={0.85} metalness={0.15} />
      </mesh>

      {/* Second Floor Offset Geometric Cube */}
      <mesh position={[0.8, 4.4, -0.4]}>
        <boxGeometry args={[4.4, 2.2, 4.2]} />
        <meshStandardMaterial color="#2d3748" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Warm Corner Glass Ribbon Window (Wraps Front & Right) */}
      <mesh position={[1.4, 1.8, 2.62]}>
        <boxGeometry args={[2.8, 2.2, 0.08]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#f59e0b"
          emissiveIntensity={0.8}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[3.12, 1.8, 1.4]}>
        <boxGeometry args={[0.08, 2.2, 2.4]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#f59e0b"
          emissiveIntensity={0.8}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Upper Floor Sleek Strip Window */}
      <mesh position={[0.8, 4.5, 1.72]}>
        <boxGeometry args={[3.6, 0.8, 0.08]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.7}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Entrance Foyer & Modern Doorway */}
      <group position={[-1.6, 0, 2.62]}>
        {/* Recessed Timber Porch */}
        <mesh position={[0, 1.25, 0.02]}>
          <boxGeometry args={[1.5, 2.5, 0.12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        {/* Modern Dark Wood Door */}
        <mesh position={[0, 1.1, 0.08]}>
          <boxGeometry args={[1.1, 2.2, 0.08]} />
          <meshStandardMaterial color="#3e2723" roughness={0.6} />
        </mesh>
        {/* Floating Entrance Canopy */}
        <mesh position={[0, 2.45, 0.45]}>
          <boxGeometry args={[2.0, 0.12, 1.1]} />
          <meshStandardMaterial color="#111827" roughness={0.5} />
        </mesh>
        {/* Porch Welcome Light */}
        <mesh position={[0, 2.36, 0.45]}>
          <boxGeometry args={[0.8, 0.03, 0.5]} />
          <meshStandardMaterial
            color="#fffbeb"
            emissive="#fef3c7"
            emissiveIntensity={0.9}
            roughness={0.2}
          />
        </mesh>
        {/* Digital House Number Plaque ("#01 KITSU") */}
        <mesh position={[-0.85, 1.5, 0.08]}>
          <boxGeometry args={[0.42, 0.28, 0.04]} />
          <meshStandardMaterial
            color="#14b8a6"
            emissive="#0d9488"
            emissiveIntensity={0.85}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Modern Cantilever Roof with LED Perimeter Glow */}
      <mesh position={[0, 3.66, 0.1]}>
        <boxGeometry args={[6.6, 0.14, 5.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Cyan/Teal LED Glow Strip along Roofline */}
      <mesh position={[0, 3.6, 2.87]}>
        <boxGeometry args={[6.5, 0.05, 0.04]} />
        <meshStandardMaterial
          color="#2dd4bf"
          emissive="#14b8a6"
          emissiveIntensity={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Minimalist Architectural Planters with Manicured Shrubs (Left & Right) */}
      {[-3.6, 3.6].map((x) => (
        <group key={`planter-${x}`} position={[x, 0, 2.6]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#374151" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <sphereGeometry args={[0.45, 12, 12]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>
        </group>
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
