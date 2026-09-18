'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LANE_COUNT, LANE_WIDTH } from '@/sim/constants'
import type { RunState } from '@/sim/run'

const PLANE_LENGTH = 400
const CELL_LENGTH = PLANE_LENGTH / 200

export function Terrain({ stateRef }: { stateRef: React.RefObject<RunState> }) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const texture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, size, size)
      for (let i = 0; i <= 6; i += 1) {
        const x = (i / 6) * size
        ctx.strokeStyle = i === 0 || i === 6 ? 'rgba(224,168,92,0.55)' : 'rgba(87,184,174,0.3)'
        ctx.lineWidth = i === 0 || i === 6 ? 3 : 2
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, size)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(226,226,226,0.28)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 1)
      ctx.lineTo(size, 1)
      ctx.stroke()
    }
    const created = new THREE.CanvasTexture(canvas)
    created.wrapS = THREE.RepeatWrapping
    created.wrapT = THREE.RepeatWrapping
    created.repeat.set(1, 200)
    return created
  }, [])

  useFrame(() => {
    const material = materialRef.current
    if (!material?.map) {
      return
    }
    const distance = stateRef.current?.distance ?? 0
    material.map.offset.y = (distance / CELL_LENGTH) % 1
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -60]}>
      <planeGeometry args={[LANE_COUNT * LANE_WIDTH, PLANE_LENGTH]} />
      <meshBasicMaterial ref={materialRef} map={texture} toneMapped={false} />
    </mesh>
  )
}
