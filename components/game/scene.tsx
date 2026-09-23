'use client'

import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Character } from '@/components/game/character'
import { Obstacles } from '@/components/game/obstacles'
import { Terrain } from '@/components/game/terrain'
import { CityProps, SkyDome, Skyline } from '@/components/game/tokyo'
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
      <color attach="background" args={['#070b16']} />
      <fog attach="fog" args={['#070b16', 60, 340]} />
      <ambientLight intensity={0.95} color="#c2d1ed" />
      <directionalLight position={[4, 10, 6]} intensity={1.15} color="#e0ebff" />
      <directionalLight position={[-5, 6, -4]} intensity={0.45} color="#8a99ff" />
      <CameraRig />
      <SkyDome />
      <Skyline />
      <Terrain stateRef={stateRef} />
      <CityProps stateRef={stateRef} />
      <Obstacles course={course} stateRef={stateRef} />
      <Character stateRef={stateRef} />
    </Canvas>
  )
}
