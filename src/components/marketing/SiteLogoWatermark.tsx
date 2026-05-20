/* eslint-disable react-hooks/immutability */
"use client"

import { useRef, useMemo, Suspense, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import "@/lib/three-compat"

// ─── Constantes ────────────────────────────────────────────────────────────────
const NUM_FRAGMENTS = 6

// Positions initiales des fragments — dispersés dans l'espace (reproductibles)
const FRAG_INIT: Array<{ p: [number, number, number]; r: [number, number, number] }> = [
  { p: [-3.4,  2.4, -1.6], r: [ 0.85,  0.70,  0.30] },
  { p: [ 2.8,  1.6, -2.4], r: [-0.60,  1.05, -0.45] },
  { p: [-2.4, -2.8,  1.8], r: [ 0.50, -0.85,  0.65] },
  { p: [ 3.2, -1.8,  1.4], r: [-0.75,  0.55,  0.35] },
  { p: [ 0.6,  3.4, -1.0], r: [ 0.95, -0.40, -0.80] },
  { p: [-2.8, -0.8,  2.4], r: [-0.55,  0.90,  0.50] },
]

// État animé par GSAP — lu dans useFrame
const gs = {
  assemblyT:    0,     // 0=dispersé, 1=assemblé
  fragOpacity:  0.38,  // fragments visibles dès le chargement (logo brisé)
  globalOpacity: 0,   // opacité du wireframe global
  globalRotY:   0,
  globalRotX:   0,
  globalScale:  1.12,
  globalPosY:   0,
}

const mousePos = { x: 0, y: 0 }

// ─── Coord helper ──────────────────────────────────────────────────────────────
const S = 1.5 / 50
const cx = 50, cy = 50

function svgPt(x: number, y: number): [number, number] {
  return [(x - cx) * S, -(y - cy) * S]
}

// ─── Build géométries ──────────────────────────────────────────────────────────
function buildGeometries() {
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

  // Wireframe global (logo propre)
  const edgesL = new THREE.EdgesGeometry(geoL, 12)
  const edgesT = new THREE.EdgesGeometry(geoT, 12)

  // Fragments : combiner les deux géos non-indexées puis splitter
  const niL = geoL.index ? geoL.toNonIndexed() : geoL
  const niT = geoT.index ? geoT.toNonIndexed() : geoT

  const posL = Array.from(niL.attributes["position"]!.array as Float32Array)
  const norL = Array.from(niL.attributes["normal"]!.array as Float32Array)
  const posT = Array.from(niT.attributes["position"]!.array as Float32Array)
  const norT = Array.from(niT.attributes["normal"]!.array as Float32Array)

  const allPos = [...posL, ...posT]
  const allNor = [...norL, ...norT]
  const totalVerts = allPos.length / 3

  // Aligner sur des multiples de 3 (un triangle = 3 vertices)
  const vertsPerFrag = Math.ceil(Math.ceil(totalVerts / NUM_FRAGMENTS) / 3) * 3

  const fragGeos: THREE.BufferGeometry[] = []
  const fragEdges: THREE.EdgesGeometry[] = []

  for (let f = 0; f < NUM_FRAGMENTS; f++) {
    const start = f * vertsPerFrag
    if (start >= totalVerts) break
    const end = Math.min(start + vertsPerFrag, totalVerts)

    const fragPos = new Float32Array(allPos.slice(start * 3, end * 3))
    const fragNor = new Float32Array(allNor.slice(start * 3, end * 3))

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(fragPos, 3))
    geo.setAttribute("normal",   new THREE.BufferAttribute(fragNor, 3))

    fragGeos.push(geo)
    fragEdges.push(new THREE.EdgesGeometry(geo, 10))
  }

  return { geoL, geoT, edgesL, edgesT, fragGeos, fragEdges, depth }
}

// ─── Fragments (groupe dédié, pas de rotation globale) ─────────────────────────
function LogoFragments({
  fragGeos,
  fragEdges,
  matFill,
  matEdge,
}: {
  fragGeos: THREE.BufferGeometry[]
  fragEdges: THREE.EdgesGeometry[]
  matFill: THREE.MeshBasicMaterial
  matEdge: THREE.LineBasicMaterial
}) {
  const refs = useRef<(THREE.Group | null)[]>(
    Array.from({ length: NUM_FRAGMENTS }, () => null)
  )

  useFrame(() => {
    const inv = 1 - gs.assemblyT
    refs.current.forEach((g, i) => {
      if (!g) return
      const init = FRAG_INIT[i]
      if (!init) return
      const { p, r } = init
      g.position.set(p[0] * inv, p[1] * inv, p[2] * inv)
      g.rotation.set(r[0] * inv, r[1] * inv, r[2] * inv)
    })
  })

  return (
    <>
      {fragGeos.map((geo, i) => {
        const edges = fragEdges[i]
        if (!edges) return null
        return (
          <group
            key={i}
            ref={(el: THREE.Group | null) => { refs.current[i] = el }}
          >
            <mesh geometry={geo} material={matFill} />
            <lineSegments geometry={edges} material={matEdge} />
          </group>
        )
      })}
    </>
  )
}

// ─── Scène 3D ─────────────────────────────────────────────────────────────────
function LogoScene() {
  const fragsGroupRef  = useRef<THREE.Group>(null!)
  const globalGroupRef = useRef<THREE.Group>(null!)
  const { geoL, geoT, edgesL, edgesT, fragGeos, fragEdges, depth } = useMemo(() => buildGeometries(), [])

  // Matériaux fragments
  const matFragFill = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#5B1A05"),
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  }), [])

  const matFragEdge = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color("#F97316"),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  // Matériaux wireframe global
  const matOrange = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color("#F97316"),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  const matCyan = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color("#22D3EE"),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [])

  const matFillL = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#7C2D0E"),
    transparent: true,
    opacity: 0,
  }), [])

  const matFillT = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#0C4A6E"),
    transparent: true,
    opacity: 0,
  }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pulse    = 1 + Math.sin(t * 0.9)  * 0.08
    const idleRotY = Math.sin(t * 0.14) * 0.04
    const idleFloat = Math.sin(t * 0.22) * 0.04

    // Groupe fragments — scale + flottement, pas de rotation (les enfants gèrent ça)
    fragsGroupRef.current.position.y = gs.globalPosY + idleFloat
    fragsGroupRef.current.scale.setScalar(Math.max(gs.globalScale, 0.01))

    // Groupe wireframe global — rotation scroll
    globalGroupRef.current.rotation.y = gs.globalRotY + idleRotY + mousePos.x * 0.10
    globalGroupRef.current.rotation.x = gs.globalRotX - mousePos.y * 0.07
    globalGroupRef.current.position.y = gs.globalPosY + idleFloat
    globalGroupRef.current.scale.setScalar(Math.max(gs.globalScale, 0.01))

    // Matériaux fragments
    matFragEdge.opacity = gs.fragOpacity * pulse
    matFragFill.opacity = gs.fragOpacity * 0.28

    // Matériaux wireframe global
    matOrange.opacity = gs.globalOpacity * pulse
    matCyan.opacity   = gs.globalOpacity * 0.75 * pulse
    matFillL.opacity  = gs.globalOpacity * 0.10
    matFillT.opacity  = gs.globalOpacity * 0.07
  })

  const zOff = -depth / 2

  return (
    <>
      {/* Fragments dispersés → assemblés */}
      <group ref={fragsGroupRef} position={[0, 0, zOff]}>
        <LogoFragments
          fragGeos={fragGeos}
          fragEdges={fragEdges}
          matFill={matFragFill}
          matEdge={matFragEdge}
        />
      </group>

      {/* Wireframe global — logo complet */}
      <group ref={globalGroupRef} position={[0, 0, zOff]}>
        <mesh geometry={geoL} material={matFillL} />
        <mesh geometry={geoT} material={matFillT} />
        <lineSegments geometry={edgesL} material={matOrange} />
        <lineSegments geometry={edgesT} material={matCyan} />
      </group>
    </>
  )
}

// ─── Particules de fond ────────────────────────────────────────────────────────
function ParticleField() {
  const count = 320
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 24
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  const ref = useRef<THREE.Points>(null!)
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.007
    ref.current.rotation.x = clock.elapsedTime * 0.003
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.012}
        color="#F97316"
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
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 0, 5]}  intensity={4.0} color="#F97316" />
      <pointLight position={[-4, 3, 2]} intensity={1.5} color="#22D3EE" />
      <pointLight position={[4, -2, 1]} intensity={1.0} color="#7C3AED" />
      <ParticleField />
      <LogoScene />
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function SiteLogoWatermark() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    setMounted(true)
  }, [])

  // Timeline GSAP scroll-driven — se réinitialise à chaque changement de route
  useEffect(() => {
    if (!mounted) return
    let cleanup: (() => void) | null = null
    let cancelled = false

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ default: gsap }, stMod]) => {
        if (cancelled) return
        gsap.registerPlugin(stMod.ScrollTrigger)
        // Tuer les anciens triggers avant de recréer (navigation client-side)
        stMod.ScrollTrigger.getAll().forEach(st => st.kill())

        // Reset — logo brisé visible dès le chargement
        Object.assign(gs, {
          assemblyT: 0, fragOpacity: 0.38, globalOpacity: 0,
          globalRotY: 0, globalRotX: 0, globalScale: 1.12, globalPosY: 0,
        })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.6,
          },
        })

        // Phase 1 — Convergence : fragments brisés → logo assemblé (0→65%)
        tl.to(gs, {
          assemblyT: 1.0,
          ease: "power3.out",
          duration: 0.65,
        }, 0)

        // Phase 2 — Crossfade fragments → wireframe global (62→72%)
        tl.to(gs, {
          fragOpacity: 0,
          ease: "power1.in",
          duration: 0.10,
        }, 0.62)
        tl.to(gs, {
          globalOpacity: 0.90,
          ease: "power1.out",
          duration: 0.10,
        }, 0.62)

        // Phase 3 — Logo assemblé : rotation 3D élégante (72→87%)
        tl.to(gs, {
          globalRotY: Math.PI * 1.25,
          globalRotX: -0.10,
          globalScale: 0.90,
          ease: "none",
          duration: 0.15,
        }, 0.72)

        // Phase 4 — Sortie (87→100%)
        tl.to(gs, {
          globalOpacity: 0.04,
          globalScale: 0.40,
          globalPosY: -0.44,
          ease: "power2.in",
          duration: 0.13,
        }, 0.87)

        cleanup = () => {
          stMod.ScrollTrigger.getAll().forEach(st => st.kill())
        }
      }
    )

    return () => { cancelled = true; cleanup?.() }
  }, [mounted, pathname])

  // Mouse parallax
  useEffect(() => {
    if (!mounted) return
    const onMove = (e: MouseEvent) => {
      mousePos.x = (e.clientX / window.innerWidth) * 2 - 1
      mousePos.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [mounted])

  if (!mounted) return null

  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 15, pointerEvents: "none", mixBlendMode: "screen" }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 44 }}
        gl={{ antialias: true, alpha: true, powerPreference: "default" }}
        style={{ background: "transparent" }}
        dpr={[1, 1.2]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
