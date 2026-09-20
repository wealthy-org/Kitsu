'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LANE_COUNT, LANE_WIDTH } from '@/sim/constants'
import type { RunState } from '@/sim/run'

const TRACK_WIDTH = LANE_COUNT * LANE_WIDTH
const BEHIND = 12

const LAMP_STEP = 24
const LAMP_COUNT = 10
const LAMP_WINDOW = LAMP_STEP * LAMP_COUNT
const BUILDING_STEP = 12
const BUILDING_COUNT = 28
const BUILDING_WINDOW = BUILDING_STEP * BUILDING_COUNT
const WALK_STEP = 2
const WALK_COUNT = 60
const WALK_WINDOW = WALK_STEP * WALK_COUNT
const BENCH_STEP = 24
const BENCH_COUNT = 6
const BENCH_WINDOW = BENCH_STEP * BENCH_COUNT
const PLANTER_STEP = 28
const PLANTER_COUNT = 6
const PLANTER_WINDOW = PLANTER_STEP * PLANTER_COUNT
const NOTICE_STEP = 34
const NOTICE_COUNT = 5
const NOTICE_WINDOW = NOTICE_STEP * NOTICE_COUNT
const SPINE_STEP = 48
const SPINE_COUNT = 4
const SPINE_WINDOW = SPINE_STEP * SPINE_COUNT
const PARAPET_STEP = 9
const PARAPET_COUNT = 28
const PARAPET_WINDOW = PARAPET_STEP * PARAPET_COUNT
const FLAG_STEP = 60
const FLAG_COUNT = 4
const FLAG_WINDOW = FLAG_STEP * FLAG_COUNT
const CRATE_STEP = 28
const CRATE_COUNT = 6
const CRATE_WINDOW = CRATE_STEP * CRATE_COUNT

const BUILDING_COLORS = ['#1b2233', '#20263a', '#171d2b', '#242b40', '#1a2130']
const SIGN_COLORS = ['#f87171', '#38bdf8', '#fbbf24', '#34d399', '#fb7185']
const SIDEWALK = '#8fa3b8'
const METAL = '#2b3245'

function hash(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function wrap(value: number, windowSize: number): number {
  return ((value % windowSize) + windowSize) % windowSize
}

// Keeps every instance in front of the camera until it passes behind it, then recycles far ahead.
function propZ(index: number, step: number, windowSize: number, distance: number, behind: number) {
  return behind - wrap(index * step - distance, windowSize)
}

function windowsTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#0b1020'
    ctx.fillRect(0, 0, size, size)
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const on = (x * 7 + y * 3) % 5 !== 0
        ctx.fillStyle = on ? 'rgba(255,236,180,0.95)' : 'rgba(96,120,165,0.4)'
        ctx.fillRect(x * 8 + 2, y * 8 + 2, 4.4, 4.4)
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.anisotropy = 16
  return texture
}

function skyTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#05070f')
    gradient.addColorStop(0.6, '#0b1330')
    gradient.addColorStop(0.86, '#16204a')
    gradient.addColorStop(1, '#0d1017')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 8, 256)
  }
  return new THREE.CanvasTexture(canvas)
}

export function SkyDome() {
  const texture = useMemo(() => skyTexture(), [])
  return (
    <mesh>
      <sphereGeometry args={[420, 32, 16]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        toneMapped={false}
        fog={false}
        depthWrite={false}
      />
    </mesh>
  )
}

export function Skyline() {
  const texture = useMemo(() => windowsTexture(), [])
  const buildings = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const height = 20 + hash(index, 7) * 46
        const width = 6 + hash(index, 8) * 9
        const x = -72 + index * 5 + hash(index, 9) * 2
        return { height, width, x }
      }),
    [],
  )

  return (
    <group position={[0, 0, -195]}>
      {buildings.map((building, index) => (
        <mesh key={index} position={[building.x, building.height / 2, 0]}>
          <boxGeometry args={[building.width, building.height, 6]} />
          <meshStandardMaterial map={texture} color="#141a29" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

// Every prop is authored with its front toward +X on the left side; the right side is mirrored
// by rotating PI around Y, so nothing ends up facing the wrong way.
function SidewalkSlab() {
  return (
    <mesh position={[0, 0.06, 0]}>
      <boxGeometry args={[1.8, 0.12, 4]} />
      <meshStandardMaterial color={SIDEWALK} roughness={0.9} />
    </mesh>
  )
}

function Lamp() {
  return (
    <group>
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[0.16, 4.4, 0.16]} />
        <meshStandardMaterial color={METAL} roughness={0.8} />
      </mesh>
      <mesh position={[0.8, 4.3, 0]}>
        <boxGeometry args={[1.6, 0.14, 0.2]} />
        <meshStandardMaterial color={METAL} roughness={0.8} />
      </mesh>
      <mesh position={[1.5, 4.15, 0]}>
        <boxGeometry args={[0.55, 0.22, 0.34]} />
        <meshStandardMaterial color="#ffe9a8" roughness={0.6} />
      </mesh>
    </group>
  )
}

function Bench() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.55, 0.1, 1.7]} />
        <meshStandardMaterial color="#6b7280" roughness={0.9} />
      </mesh>
      <mesh position={[-0.2, 0.72, 0]}>
        <boxGeometry args={[0.1, 0.5, 1.7]} />
        <meshStandardMaterial color="#6b7280" roughness={0.9} />
      </mesh>
      {[-0.7, 0.7].map((z) => (
        <mesh key={z} position={[0, 0.22, z]}>
          <boxGeometry args={[0.5, 0.45, 0.12]} />
          <meshStandardMaterial color={METAL} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Planter() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.5, 0.6, 0.8]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.3, 0.3, 0.66]} />
        <meshStandardMaterial color="#2f6b46" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Noticeboard() {
  return (
    <group>
      {[-0.7, 0.7].map((z) => (
        <mesh key={z} position={[0, 0.7, z]}>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
          <meshStandardMaterial color={METAL} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry args={[0.12, 0.95, 1.7]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
    </group>
  )
}

function ServiceSpine() {
  return (
    <group>
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[TRACK_WIDTH + 3.4, 0.18, 0.18]} />
        <meshStandardMaterial color={METAL} roughness={0.8} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (TRACK_WIDTH / 2 + 1.5), 2.5, 0]}>
          <boxGeometry args={[0.16, 5, 0.16]} />
          <meshStandardMaterial color={METAL} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Parapet() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.6, 0.5, 6]} />
      <meshStandardMaterial color="#2a3448" roughness={0.95} />
    </mesh>
  )
}

function FlagPole({ banner }: { banner?: boolean }) {
  return (
    <group>
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[0.12, 5.2, 0.12]} />
        <meshStandardMaterial color={METAL} roughness={0.8} />
      </mesh>
      {banner ? (
        <mesh position={[0.55, 4.2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.9, 1.4, 0.06]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.8} />
        </mesh>
      ) : (
        <mesh position={[0.45, 4.6, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.9, 0.6, 0.05]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.8} />
        </mesh>
      )}
    </group>
  )
}

function Crate() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#7c5a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0.25, 1.15, 0.1]}>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color="#8b6844" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Row({
  count,
  step,
  windowSize,
  stateRef,
  getX,
  getY,
  offset,
  children,
}: {
  count: number
  step: number
  windowSize: number
  stateRef: React.RefObject<RunState>
  getX: (index: number) => number
  getY?: (index: number) => number
  offset: number
  children: (index: number) => React.ReactNode
}) {
  const refs = useRef<Array<THREE.Group | null>>([])

  useFrame(() => {
    const distance = stateRef.current?.distance ?? 0
    for (let index = 0; index < count; index += 1) {
      const group = refs.current[index]
      if (group) {
        group.position.z = propZ(index, step, windowSize, distance, offset)
      }
    }
  })

  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <group
          key={index}
          ref={(node) => {
            refs.current[index] = node
          }}
          position={[getX(index), getY ? getY(index) : 0, 0]}
        >
          {children(index)}
        </group>
      ))}
    </group>
  )
}

export function CityProps({ stateRef }: { stateRef: React.RefObject<RunState> }) {
  const buildingRefs = useRef<Array<THREE.Group | null>>([])
  const texture = useMemo(() => windowsTexture(), [])

  useFrame(() => {
    const distance = stateRef.current?.distance ?? 0
    for (let index = 0; index < BUILDING_COUNT * 2; index += 1) {
      const group = buildingRefs.current[index]
      if (group) {
        group.position.z = propZ(index, BUILDING_STEP, BUILDING_WINDOW, distance, 16)
      }
    }
  })

  return (
    <group>
      <Row
        count={LAMP_COUNT * 2}
        step={LAMP_STEP}
        windowSize={LAMP_WINDOW}
        stateRef={stateRef}
        getX={(index) => (index % 2 === 0 ? -1 : 1) * (TRACK_WIDTH / 2 + 0.9)}
        offset={BEHIND}
      >
        {(index) => (
          <group rotation={[0, index % 2 === 0 ? 0 : Math.PI, 0]}>
            <Lamp />
          </group>
        )}
      </Row>

      <Row
        count={WALK_COUNT}
        step={WALK_STEP}
        windowSize={WALK_WINDOW}
        stateRef={stateRef}
        getX={(index) => (index % 2 === 0 ? -1 : 1) * (TRACK_WIDTH / 2 + 0.9)}
        offset={BEHIND}
      >
        {() => <SidewalkSlab />}
      </Row>

      <Row
        count={BENCH_COUNT * 2}
        step={BENCH_STEP}
        windowSize={BENCH_WINDOW}
        stateRef={stateRef}
        getX={(index) => (index % 2 === 0 ? -1 : 1) * (TRACK_WIDTH / 2 + 1.6)}
        offset={BEHIND}
      >
        {(index) => (
          <group rotation={[0, index % 2 === 0 ? 0 : Math.PI, 0]}>
            <Bench />
          </group>
        )}
      </Row>

      <Row
        count={PLANTER_COUNT * 2}
        step={PLANTER_STEP}
        windowSize={PLANTER_WINDOW}
        stateRef={stateRef}
        getX={(index) => (index % 2 === 0 ? -1 : 1) * (TRACK_WIDTH / 2 + 1.7)}
        offset={BEHIND}
      >
        {() => <Planter />}
      </Row>

      <Row
        count={NOTICE_COUNT * 2}
        step={NOTICE_STEP}
        windowSize={NOTICE_WINDOW}
        stateRef={stateRef}
        getX={(index) => (index % 2 === 0 ? -1 : 1) * (TRACK_WIDTH / 2 + 1.7)}
        offset={BEHIND}
      >
        {(index) => (
          <group rotation={[0, index % 2 === 0 ? 0 : Math.PI, 0]}>
            <Noticeboard />
          </group>
        )}
      </Row>

      <Row
        count={SPINE_COUNT}
        step={SPINE_STEP}
        windowSize={SPINE_WINDOW}
        stateRef={stateRef}
        getX={() => 0}
        offset={BEHIND}
      >
        {() => <ServiceSpine />}
      </Row>

      <Row
        count={PARAPET_COUNT}
        step={PARAPET_STEP}
        windowSize={PARAPET_WINDOW}
        stateRef={stateRef}
        getX={(index) => (index % 2 === 0 ? -1 : 1) * (TRACK_WIDTH / 2 + 7.4)}
        getY={() => 11}
        offset={BEHIND}
      >
        {() => <Parapet />}
      </Row>

      <Row
        count={FLAG_COUNT * 2}
        step={FLAG_STEP}
        windowSize={FLAG_WINDOW}
        stateRef={stateRef}
        getX={(index) => (index % 2 === 0 ? -1 : 1) * (TRACK_WIDTH / 2 + 1.6)}
        offset={BEHIND}
      >
        {(index) => <FlagPole banner={index % 4 === 1 || index % 4 === 3} />}
      </Row>

      <Row
        count={CRATE_COUNT * 2}
        step={CRATE_STEP}
        windowSize={CRATE_WINDOW}
        stateRef={stateRef}
        getX={(index) => (index % 2 === 0 ? -1 : 1) * (TRACK_WIDTH / 2 + 2.6)}
        offset={BEHIND}
      >
        {() => <Crate />}
      </Row>

      {Array.from({ length: BUILDING_COUNT * 2 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1
        const height = 10 + hash(index, 1) * 30
        const width = 6 + hash(index, 2) * 6
        const depth = 7 + hash(index, 3) * 6
        const color = BUILDING_COLORS[Math.floor(hash(index, 4) * BUILDING_COLORS.length)]
        const signColor = SIGN_COLORS[Math.floor(hash(index, 5) * SIGN_COLORS.length)]
        const x = side * (TRACK_WIDTH / 2 + 9 + width / 2)
        return (
          <group
            key={`building-${index}`}
            ref={(node) => {
              buildingRefs.current[index] = node
            }}
            position={[x, 0, 0]}
          >
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial
                map={texture}
                color={color}
                roughness={0.9}
              />
            </mesh>
            <mesh
              position={[side * -width * 0.35, 3 + hash(index, 6) * (height - 6), depth / 2 + 0.05]}
            >
              <planeGeometry args={[width * 0.55, 1.8]} />
              <meshStandardMaterial color={signColor} transparent opacity={0.55} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
