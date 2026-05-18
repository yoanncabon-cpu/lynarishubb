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

function buildLogoGeometries() {
  const depth = 0.30

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

  return { geoL, geoT, edgesL, edgesT }
}

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeInQuad(t: number) { return t * t }

// ─── Logo avec animation assembler / éclater ─────────────────────────────────
function LogoAssembly() {
  const groupRef = useRef<THREE.Group>(null!)
  const lRef     = useRef<THREE.Group>(null!)   // corps L — orange
  const tRef     = useRef<THREE.Group>(null!)   // triangle — cyan

  const { geoL, geoT, edgesL, edgesT } = useMemo(() => buildLogoGeometries(), [])

  // L — orange brand
  const matEdgeL = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color("#F5922F"),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  // Triangle — cyan
  const matEdgeT = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color("#22D3EE"),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  const matFillL = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#7C2800"),
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide,
  }), [])

  const matFillT = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#0A3A52"),
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide,
  }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    // Cycle : 1.4s assemblage → 5s idle → 0.7s explosion → 1.1s séparé → reprend
    const ASSEMBLE = 1.4
    const IDLE     = 5.0
    const EXPLODE  = 0.7
    const APART    = 1.1
    const CYCLE    = ASSEMBLE + IDLE + EXPLODE + APART

    const ct = t % CYCLE
    let sep = 0   // 0 = pièces jointes, 1 = pièces éclatées

    if (ct < ASSEMBLE) {
      sep = easeOutCubic(1 - ct / ASSEMBLE)
    } else if (ct < ASSEMBLE + IDLE) {
      sep = 0
    } else if (ct < ASSEMBLE + IDLE + EXPLODE) {
      sep = easeInQuad((ct - ASSEMBLE - IDLE) / EXPLODE)
    } else {
      sep = 1
    }

    // L vole depuis bas-gauche
    lRef.current.position.set(-sep * 1.4, -sep * 0.9, sep * 0.35)
    lRef.current.rotation.z = -sep * 0.25
    lRef.current.rotation.x =  sep * 0.15

    // Triangle vole depuis haut-droit
    tRef.current.position.set( sep * 1.1,  sep * 1.0, -sep * 0.25)
    tRef.current.rotation.z =  sep * 0.40
    tRef.current.rotation.y = -sep * 0.20

    // Scroll exit
    const p = scrollProgress.value
    const exit = Math.max((p - 0.55) / 0.45, 0)

    // Idle float + mouse tracking
    const idleRotY  = Math.sin(t * 0.20) * 0.28
    const idleFloat = Math.sin(t * 0.30) * 0.055

    groupRef.current.rotation.y = idleRotY + mousePos.x * 0.22 + p * Math.PI * 0.28
    groupRef.current.rotation.x = Math.sin(t * 0.14) * 0.055 - mousePos.y * 0.10
    groupRef.current.position.y = idleFloat - exit * 0.3
    groupRef.current.position.z = -exit * 2.8

    // Opacités
    const appear = Math.min(t / 0.9, 1)
    const vis    = appear * (1 - exit)
    const pulse  = 0.87 + Math.sin(t * 1.15) * 0.13

    matEdgeL.opacity = vis * pulse * 0.90
    matEdgeT.opacity = vis * pulse * 0.82
    matFillL.opacity = vis * 0.13
    matFillT.opacity = vis * 0.10
  })

  return (
    <group ref={groupRef}>
      <group ref={lRef}>
        <mesh geometry={geoL} material={matFillL} />
        <lineSegments geometry={edgesL} material={matEdgeL} />
      </group>
      <group ref={tRef}>
        <mesh geometry={geoT} material={matFillT} />
        <lineSegments geometry={edgesT} material={matEdgeT} />
      </group>
    </group>
  )
}

// ─── Particules ───────────────────────────────────────────────────────────────
function ParticleField() {
  const count = 420
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 3
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  const ref = useRef<THREE.Points>(null!)
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.009
    ref.current.rotation.x = clock.elapsedTime * 0.003
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.013}
        color="#F5922F"
        transparent
        opacity={0.18}
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
      <ambientLight intensity={0.04} />
      <pointLight position={[0, 0, 4]}   intensity={4.5} color="#F5922F" />
      <pointLight position={[-3, 2, 2]}  intensity={1.8} color="#22D3EE" />
      <pointLight position={[3, -2, 1]}  intensity={1.0} color="#D4530A" />
      <ParticleField />
      <LogoAssembly />
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
      mousePos.x = (e.clientX / window.innerWidth)  * 2 - 1
      mousePos.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [reduceMotion])

  if (reduceMotion) return null

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 44 }}
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
