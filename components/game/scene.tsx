'use client'

import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Character } from '@/components/game/character'
import { Obstacles } from '@/components/game/obstacles'
import { Terrain } from '@/components/game/terrain'
import type { RunState } from '@/sim/run'
import type { Course } from '@/sim/types'

function CameraRig() {
  const camera = useThree((state) => state.camera)
  useEffect(() => {
    camera.lookAt(0, 0.9, -8)
  }, [camera])
  return null
}

export function GameScene({
  course,
  stateRef,
}: {
  course: Course
  stateRef: React.RefObject<RunState>
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true }}
      camera={{ position: [0, 3.2, 7], fov: 55 }}
      aria-hidden="true"
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 34, 130]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 8, 6]} intensity={1.1} />
      <CameraRig />
      <Terrain stateRef={stateRef} />
      <Obstacles course={course} stateRef={stateRef} />
      <Character stateRef={stateRef} />
    </Canvas>
  )
}
