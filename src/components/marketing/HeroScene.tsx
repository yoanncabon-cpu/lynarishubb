/* eslint-disable react-hooks/immutability */
"use client"

import { useRef, useMemo, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import "@/lib/three-compat"

const PARTICLE_COUNT = 100
const CONNECTION_DISTANCE = 2.4
const SPREAD = 8

function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const mouse = useRef(new THREE.Vector2(0, 0))
  const { viewport } = useThree()

  const { positionsArr, colorsArr, velocitiesArr } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const col = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT * 3)

    const colorA = new THREE.Color("#7C3AED")
    const colorB = new THREE.Color("#22D3EE")

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      pos[i3] = (Math.random() - 0.5) * SPREAD * 2
      pos[i3 + 1] = (Math.random() - 0.5) * SPREAD * 1.5
      pos[i3 + 2] = (Math.random() - 0.5) * SPREAD * 0.5

      vel[i3] = (Math.random() - 0.5) * 0.003
      vel[i3 + 1] = (Math.random() - 0.5) * 0.003
      vel[i3 + 2] = (Math.random() - 0.5) * 0.001

      const t = i / PARTICLE_COUNT
      const color = new THREE.Color().lerpColors(colorA, colorB, t)
      col[i3] = color.r
      col[i3 + 1] = color.g
      col[i3 + 2] = color.b
    }
    return { positionsArr: pos, colorsArr: col, velocitiesArr: vel }
  }, [])

  const linePositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 50 * 3), [])
  const lineColors = useMemo(() => new Float32Array(PARTICLE_COUNT * 50 * 3), [])

  const positionAttr = useMemo(
    () => new THREE.BufferAttribute(positionsArr, 3),
    [positionsArr]
  )
  const colorAttr = useMemo(
    () => new THREE.BufferAttribute(colorsArr, 3),
    [colorsArr]
  )
  const linePosAttr = useMemo(
    () => new THREE.BufferAttribute(linePositions, 3),
    [linePositions]
  )
  const lineColAttr = useMemo(
    () => new THREE.BufferAttribute(lineColors, 3),
    [lineColors]
  )

  const handlePointerMove = useCallback((e: { point: THREE.Vector3 }) => {
    mouse.current.set(e.point.x, e.point.y)
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current || !linesRef.current) return

    const posArr = positionsArr

    // Move particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      posArr[i3] = (posArr[i3]! + velocitiesArr[i3]! + mouse.current.x * 0.0002)
      posArr[i3 + 1] = (posArr[i3 + 1]! + velocitiesArr[i3 + 1]! + mouse.current.y * 0.0002)
      posArr[i3 + 2] = (posArr[i3 + 2]! + velocitiesArr[i3 + 2]!)

      // Bounds wrapping
      if (posArr[i3]! > SPREAD) posArr[i3] = -SPREAD
      if (posArr[i3]! < -SPREAD) posArr[i3] = SPREAD
      if (posArr[i3 + 1]! > SPREAD * 0.75) posArr[i3 + 1] = -SPREAD * 0.75
      if (posArr[i3 + 1]! < -SPREAD * 0.75) posArr[i3 + 1] = SPREAD * 0.75
      if (posArr[i3 + 2]! > SPREAD * 0.25) posArr[i3 + 2] = -SPREAD * 0.25
      if (posArr[i3 + 2]! < -SPREAD * 0.25) posArr[i3 + 2] = SPREAD * 0.25
    }
    positionAttr.needsUpdate = true

    // Slow global rotation
    pointsRef.current.rotation.y += 0.0003 * Math.min(delta * 60, 2)

    // Connection lines
    const MAX_CONNECTIONS = PARTICLE_COUNT * 50
    let lineIdx = 0
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (lineIdx >= MAX_CONNECTIONS) break
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        if (lineIdx >= MAX_CONNECTIONS) break
        const ix = i * 3, jx = j * 3
        const dx = posArr[ix]! - posArr[jx]!
        if (Math.abs(dx) >= CONNECTION_DISTANCE) continue // early exit
        const dy = posArr[ix + 1]! - posArr[jx + 1]!
        if (Math.abs(dy) >= CONNECTION_DISTANCE) continue // early exit
        const dz = posArr[ix + 2]! - posArr[jx + 2]!
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (dist < CONNECTION_DISTANCE) {
          const alpha = 1 - dist / CONNECTION_DISTANCE
          const li = lineIdx * 6

          linePositions[li] = posArr[ix]!
          linePositions[li + 1] = posArr[ix + 1]!
          linePositions[li + 2] = posArr[ix + 2]!
          linePositions[li + 3] = posArr[jx]!
          linePositions[li + 4] = posArr[jx + 1]!
          linePositions[li + 5] = posArr[jx + 2]!

          lineColors[li] = 0.486 * alpha
          lineColors[li + 1] = 0.227 * alpha
          lineColors[li + 2] = 0.929 * alpha
          lineColors[li + 3] = 0.133 * alpha
          lineColors[li + 4] = 0.827 * alpha
          lineColors[li + 5] = 0.933 * alpha

          lineIdx++
        }
      }
    }

    linePosAttr.needsUpdate = true
    lineColAttr.needsUpdate = true
    linesRef.current.geometry.setDrawRange(0, lineIdx * 2)

    linesRef.current.rotation.y = pointsRef.current.rotation.y
  })

  return (
    <group>
      {/* Invisible plane for raycasting */}
      <mesh visible={false} onPointerMove={handlePointerMove}>
        <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
        <meshBasicMaterial />
      </mesh>

      <points ref={pointsRef}>
        <bufferGeometry>
          <primitive attach="attributes-position" object={positionAttr} />
          <primitive attach="attributes-color" object={colorAttr} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <primitive attach="attributes-position" object={linePosAttr} />
          <primitive attach="attributes-color" object={lineColAttr} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}

export function HeroScene() {
  return (
    <div className="absolute inset-0 z-0" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <ParticleNetwork />
      </Canvas>
    </div>
  )
}
