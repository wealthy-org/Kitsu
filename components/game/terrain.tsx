'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LANE_COUNT, LANE_WIDTH } from '@/sim/constants'
import type { RunState } from '@/sim/run'

const PLANE_LENGTH = 400
const CELL_LENGTH = PLANE_LENGTH / 200
const TRACK_WIDTH = LANE_COUNT * LANE_WIDTH
const KERB_WIDTH = 0.32
const KERB_HEIGHT = 0.08
const SIDEWALK_WIDTH = 4.5

function roadTexture(): THREE.Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Rich asphalt base
    ctx.fillStyle = '#0d1118'
    ctx.fillRect(0, 0, size, size)

    // Subtle asphalt grain texture
    ctx.fillStyle = '#141a24'
    for (let i = 0; i < 90; i += 1) {
      const x = (i * 47) % size
      const y = (i * 71) % size
      ctx.fillRect(x, y, 4, 3)
    }

    // Neon lane divider dashes (Teal neon with soft glow)
    for (const boundary of [1 / 3, 2 / 3]) {
      const x = boundary * size

      // Soft glow
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.28)'
      ctx.lineWidth = 8
      ctx.setLineDash([28, 20])
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, size)
      ctx.stroke()

      // Sharp core neon
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.95)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, size)
      ctx.stroke()
    }

    // Outer edge guide lines (Vibrant electric yellow neon)
    ctx.setLineDash([])
    for (const edge of [3, size - 3]) {
      // Soft amber glow
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'
      ctx.lineWidth = 7
      ctx.beginPath()
      ctx.moveTo(edge, 0)
      ctx.lineTo(edge, size)
      ctx.stroke()

      // Vibrant electric yellow core neon
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.98)'
      ctx.lineWidth = 2.8
      ctx.beginPath()
      ctx.moveTo(edge, 0)
      ctx.lineTo(edge, size)
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 200)
  texture.anisotropy = 8
  return texture
}

function kerbTexture(): THREE.Texture {
  const width = 32
  const height = 128
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, width, height)

    // Alternating hazard blocks (Amber warning)
    const segments = 4
    const segH = height / segments
    for (let i = 0; i < segments; i += 2) {
      ctx.fillStyle = '#f59e0b'
      ctx.fillRect(0, i * segH, width, segH)
      ctx.fillStyle = '#fef3c7'
      ctx.fillRect(width - 6, i * segH, 3, segH)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 100)
  return texture
}

export function Terrain({ stateRef }: { stateRef: React.RefObject<RunState> }) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const kerbMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const roadTex = useMemo(() => roadTexture(), [])
  const kerbTex = useMemo(() => kerbTexture(), [])

  useFrame(() => {
    const distance = stateRef.current?.distance ?? 0
    const offset = (distance / CELL_LENGTH) % 1
    if (materialRef.current?.map) {
      materialRef.current.map.offset.y = offset
    }
    if (kerbMaterialRef.current?.map) {
      kerbMaterialRef.current.map.offset.y = (distance / (CELL_LENGTH * 2)) % 1
    }
  })

  const halfTrack = TRACK_WIDTH / 2
  const kerbX = halfTrack + KERB_WIDTH / 2
  const sidewalkX = halfTrack + KERB_WIDTH + SIDEWALK_WIDTH / 2

  return (
    <group>
      {/* Expansive dark void floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, -120]}>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color="#080a0f" roughness={1} />
      </mesh>

      {/* Main Runner Track with neon lane markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -PLANE_LENGTH / 2 + 20]}>
        <planeGeometry args={[TRACK_WIDTH, PLANE_LENGTH]} />
        <meshBasicMaterial ref={materialRef} map={roadTex} toneMapped={false} />
      </mesh>

      {/* 3D Elevated Reflective Kerbs (Left & Right) */}
      {[-1, 1].map((side) => (
        <group key={`kerb-${side}`}>
          <mesh position={[side * kerbX, KERB_HEIGHT / 2, -PLANE_LENGTH / 2 + 20]}>
            <boxGeometry args={[KERB_WIDTH, KERB_HEIGHT, PLANE_LENGTH]} />
            <meshBasicMaterial ref={kerbMaterialRef} map={kerbTex} toneMapped={false} />
          </mesh>
          {/* Sidewalk slab adjacent to kerb */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[side * sidewalkX, 0.02, -PLANE_LENGTH / 2 + 20]}
          >
            <planeGeometry args={[SIDEWALK_WIDTH, PLANE_LENGTH]} />
            <meshStandardMaterial color="#141824" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
