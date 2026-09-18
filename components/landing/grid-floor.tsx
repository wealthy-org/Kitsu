'use client'

import { useEffect, useRef } from 'react'

export function GridFloor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let t = 0
    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const horizon = height * 0.42
      ctx.lineWidth = 1

      for (let i = 0; i < 24; i += 1) {
        const p = i / 24
        const ease = p * p * 2.2
        const phase = (t * 0.06) % (height / 24)
        const y = horizon + ((ease * (height - horizon) + phase) % (height - horizon))
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.globalAlpha = 0.06 + ease * 0.28
        ctx.strokeStyle = 'rgba(226,226,226,1)'
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      for (const lane of [-1, -0.5, 0, 0.5, 1]) {
        ctx.beginPath()
        ctx.moveTo(width / 2 + lane * width * 0.04, horizon)
        ctx.lineTo(width / 2 + lane * width * 1.1, height)
        ctx.strokeStyle =
          Math.abs(lane) === 1 ? 'rgba(224,168,92,0.3)' : 'rgba(87,184,174,0.2)'
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.moveTo(0, horizon)
      ctx.lineTo(width, horizon)
      ctx.lineWidth = 1.4
      ctx.strokeStyle = 'rgba(224,168,92,0.5)'
      ctx.stroke()
    }

    const loop = () => {
      draw()
      t += 1
      if (!reduced) {
        raf = requestAnimationFrame(loop)
      }
    }

    resize()
    loop()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
