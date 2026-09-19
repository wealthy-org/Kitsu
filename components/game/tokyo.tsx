'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LANE_COUNT, LANE_WIDTH } from '@/sim/constants'
import type { RunState } from '@/sim/run'

const TRACK_WIDTH = LANE_COUNT * LANE_WIDTH
const LAMP_STEP = 16
const LAMP_COUNT = 20
const LAMP_WINDOW = LAMP_STEP * LAMP_COUNT
const BUILDING_STEP = 12
const BUILDING_COUNT = 28
const BUILDING_WINDOW = BUILDING_STEP * BUILDING_COUNT

const BUILDING_COLORS = ['#1b2233', '#20263a', '#171d2b', '#242b40', '#1a2130']
const SIGN_COLORS = ['#f87171', '#38bdf8', '#fbbf24', '#34d399', '#fb7185']

function hash(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
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

// Keep every instance in front of the camera until it passes behind it, then recycle far ahead.
function propZ(index: number, step: number, windowSize: number, distance: number, behind: number) {
  const value = (((index * step - distance) % windowSize) + windowSize) % windowSize
  return behind - value
}

export function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, -120]}>
      <planeGeometry args={[900, 900]} />
      <meshStandardMaterial color="#0d1017" roughness={1} />
    </mesh>
  )
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

export function CityProps({ stateRef }: { stateRef: React.RefObject<RunState> }) {
  const lampRefs = useRef<Array<THREE.Group | null>>([])
  const buildingRefs = useRef<Array<THREE.Group | null>>([])
  const texture = useMemo(() => windowsTexture(), [])

  useFrame(() => {
    const distance = stateRef.current?.distance ?? 0
    for (let index = 0; index < LAMP_COUNT * 2; index += 1) {
      const group = lampRefs.current[index]
      if (group) {
        group.position.z = propZ(index, LAMP_STEP, LAMP_WINDOW, distance, 11)
      }
    }
    for (let index = 0; index < BUILDING_COUNT * 2; index += 1) {
      const group = buildingRefs.current[index]
      if (group) {
        group.position.z = propZ(index, BUILDING_STEP, BUILDING_WINDOW, distance, 16)
      }
    }
  })

  return (
    <group>
      {Array.from({ length: LAMP_COUNT * 2 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1
        const x = side * (TRACK_WIDTH / 2 + 0.8)
        return (
          <group
            key={`lamp-${index}`}
            ref={(node) => {
              lampRefs.current[index] = node
            }}
            position={[x, 0, 0]}
          >
            <mesh position={[0, 2.2, 0]}>
              <boxGeometry args={[0.14, 4.4, 0.14]} />
              <meshStandardMaterial color="#2b3245" roughness={0.8} />
            </mesh>
            <mesh position={[side * -0.5, 4.3, 0]}>
              <boxGeometry args={[1.1, 0.18, 0.3]} />
              <meshStandardMaterial color="#2b3245" roughness={0.8} />
            </mesh>
            <mesh position={[side * -0.9, 4.15, 0]}>
              <boxGeometry args={[0.5, 0.22, 0.34]} />
              <meshStandardMaterial color="#ffe9a8" transparent opacity={0.6} />
            </mesh>
          </group>
        )
      })}

      {Array.from({ length: BUILDING_COUNT * 2 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1
        const height = 10 + hash(index, 1) * 30
        const width = 5 + hash(index, 2) * 6
        const depth = 6 + hash(index, 3) * 6
        const color = BUILDING_COLORS[Math.floor(hash(index, 4) * BUILDING_COLORS.length)]
        const signColor = SIGN_COLORS[Math.floor(hash(index, 5) * SIGN_COLORS.length)]
        const x = side * (TRACK_WIDTH / 2 + 4.5 + width / 2)
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
              <meshStandardMaterial map={texture} color={color} roughness={0.9} />
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
