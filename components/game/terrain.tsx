'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LANE_COUNT, LANE_WIDTH } from '@/sim/constants'
import type { RunState } from '@/sim/run'

const PLANE_LENGTH = 400
const CELL_LENGTH = PLANE_LENGTH / 200
const TRACK_WIDTH = LANE_COUNT * LANE_WIDTH

function roadTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#15171d'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#1b1e26'
    for (let i = 0; i < 40; i += 1) {
      const x = (i * 37) % size
      const y = (i * 53) % size
      ctx.fillRect(x, y, 6, 3)
    }
    ctx.strokeStyle = 'rgba(235,235,240,0.7)'
    ctx.lineWidth = 2
    ctx.setLineDash([16, 12])
    for (const boundary of [1 / 3, 2 / 3]) {
      const x = boundary * size
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, size)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(240,200,90,0.75)'
    ctx.lineWidth = 3
    for (const edge of [0, size]) {
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
  return texture
}

export function Terrain({ stateRef }: { stateRef: React.RefObject<RunState> }) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const texture = useMemo(() => roadTexture(), [])

  useFrame(() => {
    const material = materialRef.current
    if (!material?.map) {
      return
    }
    const distance = stateRef.current?.distance ?? 0
    material.map.offset.y = (distance / CELL_LENGTH) % 1
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -60]}>
        <planeGeometry args={[TRACK_WIDTH, PLANE_LENGTH]} />
        <meshBasicMaterial ref={materialRef} map={texture} toneMapped={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (TRACK_WIDTH / 2 + 0.8), 0.12, -60]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1.6, PLANE_LENGTH]} />
          <meshBasicMaterial color="#0e1016" toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
