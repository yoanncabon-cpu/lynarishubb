"use client"

import { useRef, useMemo, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Sparkles } from "@react-three/drei"
import * as THREE from "three"
import { useReducedMotion } from "framer-motion"

// ─── Géométrie du logo Lynaris ────────────────────────────────────────────────
// SVG viewBox 0 0 100 100 → normalisé Three.js [-1.5, 1.5], Y inversé
const S = 1.5 / 50 // scale factor : px SVG → unité Three
const cx = 50, cy = 50 // centre SVG

function svgPt(x: number, y: number): [number, number] {
  return [(x - cx) * S, -(y - cy) * S]
}

function buildLogoGeometry() {
  // Polygone principal — L avec coupe diagonale
  const lShape = new THREE.Shape()
  const lPts: [number, number][] = [
    svgPt(0, 0), svgPt(24, 0), svgPt(40, 18), svgPt(40, 65),
    svgPt(100, 65), svgPt(100, 100), svgPt(0, 100),
  ]
  lShape.moveTo(lPts[0]![0], lPts[0]![1])
  lPts.slice(1).forEach((p) => lShape.lineTo(p[0], p[1]))
  lShape.closePath()

  // Triangle — coin supérieur-droit
  const tShape = new THREE.Shape()
  const tPts: [number, number][] = [svgPt(58, 0), svgPt(100, 0), svgPt(100, 42)]
  tShape.moveTo(tPts[0]![0], tPts[0]![1])
  tPts.slice(1).forEach((p) => tShape.lineTo(p[0], p[1]))
  tShape.closePath()

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.04,
    bevelSegments: 4,
  }

  const geoL = new THREE.ExtrudeGeometry(lShape, extrudeSettings)
  const geoT = new THREE.ExtrudeGeometry(tShape, extrudeSettings)

  // Merge les deux géométries
  const merged = new THREE.BufferGeometry()
  const positions: number[] = []
  const normals: number[] = []
  for (const geo of [geoL, geoT]) {
    geo.computeVertexNormals()
    const pos = geo.attributes.position as THREE.BufferAttribute
    const nor = geo.attributes.normal as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
      normals.push(nor.getX(i), nor.getY(i), nor.getZ(i))
    }
  }
  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3))
  merged.center()
  return merged
}

// ─── Matériau orange Lynaris ──────────────────────────────────────────────────
function logoMaterial() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#C24400"),
    emissive: new THREE.Color("#F5922F"),
    emissiveIntensity: 0.55,
    metalness: 0.7,
    roughness: 0.18,
    side: THREE.FrontSide,
  })
}

// ─── Logo 3D animé ───────────────────────────────────────────────────────────
function LogoMesh() {
  const ref = useRef<THREE.Mesh>(null!)
  const geo = useMemo(buildLogoGeometry, [])
  const mat = useMemo(logoMaterial, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ref.current.rotation.y = Math.sin(t * 0.28) * 0.45
    ref.current.rotation.x = Math.sin(t * 0.18) * 0.08
    ref.current.position.y = Math.sin(t * 0.42) * 0.06
  })

  return <mesh ref={ref} geometry={geo} material={mat} />
}

// ─── Anneaux orbitaux ─────────────────────────────────────────────────────────
function OrbitalRings() {
  const ring1 = useRef<THREE.Mesh>(null!)
  const ring2 = useRef<THREE.Mesh>(null!)
  const ring3 = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ring1.current.rotation.z = t * 0.22
    ring1.current.rotation.x = 0.6
    ring2.current.rotation.z = -t * 0.16
    ring2.current.rotation.x = 1.1
    ring3.current.rotation.y = t * 0.12
    ring3.current.rotation.x = 0.4
  })

  const ringMat = (opacity: number, color: string) =>
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
    })

  return (
    <>
      <mesh ref={ring1}>
        <torusGeometry args={[2.4, 0.012, 6, 120]} />
        <primitive object={ringMat(0.25, "#F5922F")} attach="material" />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[3.1, 0.008, 6, 120]} />
        <primitive object={ringMat(0.15, "#A78BFA")} attach="material" />
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[3.8, 0.006, 6, 120]} />
        <primitive object={ringMat(0.10, "#22D3EE")} attach="material" />
      </mesh>
    </>
  )
}

// ─── Champ de particules ─────────────────────────────────────────────────────
function ParticleField() {
  const count = 1400
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 22
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12 - 3
    }
    return arr
  }, [])

  const ref = useRef<THREE.Points>(null!)
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.018
    ref.current.rotation.x = clock.elapsedTime * 0.008
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color="#F5922F"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  )
}

// ─── Halo de lumière derrière le logo ────────────────────────────────────────
function LogoGlow() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pulse = 0.9 + Math.sin(t * 1.1) * 0.12
    ref.current.scale.setScalar(pulse)
  })

  return (
    <mesh ref={ref} position={[0, 0, -0.5]}>
      <planeGeometry args={[5.5, 5.5]} />
      <meshBasicMaterial
        color="#F5922F"
        transparent
        opacity={0.06}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

// ─── Nébuleuse de fond ───────────────────────────────────────────────────────
function Nebula() {
  return (
    <>
      {/* Glow orange Lynaris */}
      <mesh position={[0.5, 0.3, -8]}>
        <planeGeometry args={[18, 12]} />
        <meshBasicMaterial
          color="#E8530A"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Glow violet */}
      <mesh position={[-2, -1, -10]}>
        <planeGeometry args={[20, 14]} />
        <meshBasicMaterial
          color="#7C3AED"
          transparent
          opacity={0.09}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Glow cyan subtil */}
      <mesh position={[3, 1, -9]}>
        <planeGeometry args={[14, 10]} />
        <meshBasicMaterial
          color="#22D3EE"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

// ─── Scène complète ──────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      {/* Éclairage */}
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 4]} intensity={3.5} color="#F5922F" />
      <pointLight position={[-4, 3, 2]} intensity={1.2} color="#A78BFA" />
      <pointLight position={[4, -2, 2]} intensity={0.8} color="#22D3EE" />
      <directionalLight position={[0, 8, 4]} intensity={0.6} color="#FFFFFF" />

      {/* Fond */}
      <Nebula />
      <ParticleField />

      {/* Sparkles autour du logo */}
      <Sparkles
        count={60}
        scale={5}
        size={0.6}
        speed={0.25}
        opacity={0.5}
        color="#F5922F"
      />
      <Sparkles
        count={30}
        scale={7}
        size={0.4}
        speed={0.15}
        opacity={0.25}
        color="#A78BFA"
      />

      {/* Logo */}
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.12}>
        <LogoGlow />
        <LogoMesh />
      </Float>

      {/* Anneaux */}
      <OrbitalRings />
    </>
  )
}

// ─── Export principal ─────────────────────────────────────────────────────────
export function HeroLogo3D() {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return null

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
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
