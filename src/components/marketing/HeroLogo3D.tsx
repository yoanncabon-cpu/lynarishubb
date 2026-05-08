/* eslint-disable react-hooks/immutability */
"use client"

import { useRef, useMemo, Suspense, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import "@/lib/three-compat"
import { useReducedMotion } from "framer-motion"

const scrollProgress = { value: 0 }
const mousePos = { x: 0, y: 0 }

const S = 1.5 / 50
const cx = 50, cy = 50

function svgPt(x: number, y: number): [number, number] {
  return [(x - cx) * S, -(y - cy) * S]
}

// ─── Géométries du logo Lynaris ───────────────────────────────────────────────
function buildLogoWireframes() {
  const depth = 0.28

  const lShape = new THREE.Shape()
  const lPts: [number, number][] = [
    svgPt(0, 0), svgPt(24, 0), svgPt(40, 18), svgPt(40, 65),
    svgPt(100, 65), svgPt(100, 100), svgPt(0, 100),
  ]
  lShape.moveTo(lPts[0]![0], lPts[0]![1])
  lPts.slice(1).forEach(p => lShape.lineTo(p[0], p[1]))
  lShape.closePath()

  const tShape = new THREE.Shape()
  const tPts: [number, number][] = [svgPt(58, 0), svgPt(100, 0), svgPt(100, 42)]
  tShape.moveTo(tPts[0]![0], tPts[0]![1])
  tPts.slice(1).forEach(p => tShape.lineTo(p[0], p[1]))
  tShape.closePath()

  const opts: THREE.ExtrudeGeometryOptions = {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 3,
  }

  const geoL = new THREE.ExtrudeGeometry(lShape, opts)
  const geoT = new THREE.ExtrudeGeometry(tShape, opts)
  const edgesL = new THREE.EdgesGeometry(geoL, 12)
  const edgesT = new THREE.EdgesGeometry(geoT, 12)

  return { geoL, geoT, edgesL, edgesT, depth }
}

// ─── Logo en wireframe 3D ─────────────────────────────────────────────────────
function LogoWireframe() {
  const groupRef = useRef<THREE.Group>(null!)
  const { geoL, geoT, edgesL, edgesT, depth } = useMemo(() => buildLogoWireframes(), [])

  // Arêtes principales — violet
  const matEdge = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color("#A78BFA"),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  // Accent triangle — cyan
  const matAccent = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color("#22D3EE"),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  // Fill intérieur très subtil — violet sombre
  const matFillL = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#2D1B69"),
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide,
  }), [])

  // Fill triangle — cyan profond
  const matFillT = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#0C4A6E"),
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide,
  }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const p = scrollProgress.value

    const appear = Math.min(t / 1.8, 1)
    const exit   = Math.max((p - 0.65) / 0.35, 0)
    const vis    = appear * (1 - exit)

    const idleRotY   = Math.sin(t * 0.22) * 0.35
    const idleFloat  = Math.sin(t * 0.31) * 0.06
    const scrollRotY = p * Math.PI * 0.35

    groupRef.current.rotation.y = idleRotY + scrollRotY + mousePos.x * 0.28
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.06 - mousePos.y * 0.15
    groupRef.current.position.y = idleFloat - p * 0.25
    groupRef.current.position.z = -exit * 2.5

    const pulse = 0.85 + Math.sin(t * 1.3) * 0.15
    matEdge.opacity   = vis * pulse * 0.95
    matAccent.opacity = vis * pulse * 0.70
    matFillL.opacity  = vis * 0.10
    matFillT.opacity  = vis * 0.08
  })

  return (
    <group ref={groupRef} position={[0, 0, -depth / 2]}>
      <mesh geometry={geoL} material={matFillL} />
      <mesh geometry={geoT} material={matFillT} />
      <lineSegments geometry={edgesL} material={matEdge} />
      <lineSegments geometry={edgesT} material={matAccent} />
    </group>
  )
}

// ─── Particules fines — violet/blanc ──────────────────────────────────────────
function ParticleField() {
  const count = 500
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 18
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 3
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  const ref = useRef<THREE.Points>(null!)
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.011
    ref.current.rotation.x = clock.elapsedTime * 0.004
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.016}
        color="#8B5CF6"
        transparent
        opacity={0.38}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── Scène ────────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 4]} intensity={5} color="#7C3AED" />
      <pointLight position={[-3, 2, 2]} intensity={1.8} color="#22D3EE" />
      <pointLight position={[3, -2, 1]} intensity={1.2} color="#A78BFA" />
      <ParticleField />
      <LogoWireframe />
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function HeroLogo3D() {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    let cleanup: (() => void) | null = null
    let cancelled = false

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ default: gsap }, stMod]) => {
        if (cancelled) return
        gsap.registerPlugin(stMod.ScrollTrigger)
        const trigger = stMod.ScrollTrigger.create({
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => { scrollProgress.value = self.progress },
        })
        cleanup = () => trigger.kill()
      }
    )
    return () => { cancelled = true; cleanup?.() }
  }, [reduceMotion])

  useEffect(() => {
    if (reduceMotion) return
    const onMove = (e: MouseEvent) => {
      mousePos.x = (e.clientX / window.innerWidth) * 2 - 1
      mousePos.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [reduceMotion])

  if (reduceMotion) return null

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
