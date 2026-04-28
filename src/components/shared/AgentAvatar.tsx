/**
 * AgentAvatar — SVG cartoon 3D avatars pour chaque agent Lynaris.
 * Style "clay/Memoji" : gradient sphérique, highlight spéculaire, visage expressif,
 * accessoire caractéristique du rôle de chaque agent.
 */

import React, { useId } from "react"

export interface AgentAvatarProps {
  slug: string
  /** Garde la prop name/color pour compatibilité mais pas utilisées dans le SVG */
  name?: string
  color?: string
  size?: number
  glow?: boolean
  className?: string
  style?: React.CSSProperties
}

// ─── Individual SVG characters ────────────────────────────────────────────────

function MarineAvatar({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#7EF0F0" />
          <stop offset="100%" stopColor="#0891B2" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDEBD0" />
          <stop offset="100%" stopColor="#F4C9B4" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${id}-bg)`} />
      <ellipse cx="28" cy="20" rx="14" ry="9" fill="rgba(255,255,255,0.38)" />
      <ellipse cx="40" cy="22" rx="20" ry="13" fill="#3B2314" />
      <ellipse cx="40" cy="46" rx="19" ry="21" fill={`url(#${id}-face)`} />
      <ellipse cx="27" cy="51" rx="5" ry="3" fill="rgba(255,140,120,0.32)" />
      <ellipse cx="53" cy="51" rx="5" ry="3" fill="rgba(255,140,120,0.32)" />
      <circle cx="33" cy="43" r="4.5" fill="#1C1C1E" />
      <circle cx="47" cy="43" r="4.5" fill="#1C1C1E" />
      <circle cx="34.5" cy="41.5" r="1.8" fill="white" />
      <circle cx="48.5" cy="41.5" r="1.8" fill="white" />
      <path d="M 33 54 Q 40 61 47 54" stroke="#C97A6A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 14 42 Q 14 11 40 10 Q 66 11 66 42" fill="none" stroke="#0E7490" strokeWidth="4" strokeLinecap="round" />
      <rect x="9" y="38" width="10" height="13" rx="5" fill="#0E7490" />
      <rect x="61" y="38" width="10" height="13" rx="5" fill="#0E7490" />
      <path d="M 69 44 Q 74 52 71 58" stroke="#0E7490" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="70" cy="60" r="3" fill="#22D3EE" />
    </>
  )
}

function CharlesAvatar({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#6D28D9" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE8D0" />
          <stop offset="100%" stopColor="#F0C8A4" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${id}-bg)`} />
      <ellipse cx="28" cy="20" rx="14" ry="9" fill="rgba(255,255,255,0.38)" />
      <ellipse cx="40" cy="23" rx="20" ry="13" fill="#1C1005" />
      <ellipse cx="40" cy="46" rx="18" ry="21" fill={`url(#${id}-face)`} />
      <path d="M 29 38 Q 33 35 37 37" stroke="#3B2314" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 43 37 Q 47 35 51 38" stroke="#3B2314" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="33" cy="43" r="4.5" fill="#1C1C1E" />
      <circle cx="47" cy="43" r="4.5" fill="#1C1C1E" />
      <circle cx="34.5" cy="41.5" r="1.8" fill="white" />
      <circle cx="48.5" cy="41.5" r="1.8" fill="white" />
      <rect x="27.5" y="39" width="12" height="9" rx="4" fill="none" stroke="#A78BFA" strokeWidth="2" />
      <rect x="40.5" y="39" width="12" height="9" rx="4" fill="none" stroke="#A78BFA" strokeWidth="2" />
      <line x1="40" y1="43" x2="41" y2="43" stroke="#A78BFA" strokeWidth="2" />
      <path d="M 34 55 Q 40 60 46 55" stroke="#C07A50" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 29 68 L 35 62 L 40 65 L 45 62 L 51 68" stroke="#8B5CF6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

function LouAvatar({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#DB2777" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE8D0" />
          <stop offset="100%" stopColor="#F4C9B4" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${id}-bg)`} />
      <ellipse cx="28" cy="20" rx="14" ry="9" fill="rgba(255,255,255,0.38)" />
      <path d="M 18 32 Q 20 15 40 12 Q 60 15 62 32 Q 63 20 58 16 Q 52 10 40 10 Q 28 10 22 16 Q 17 20 18 32" fill="#3B1C12" />
      <path d="M 18 38 Q 15 55 18 65 L 20 55 Q 18 48 20 42" fill="#3B1C12" />
      <path d="M 62 38 Q 65 55 62 65 L 60 55 Q 62 48 60 42" fill="#3B1C12" />
      <ellipse cx="40" cy="46" rx="19" ry="22" fill={`url(#${id}-face)`} />
      <ellipse cx="27" cy="51" rx="5" ry="3" fill="rgba(255,130,160,0.35)" />
      <ellipse cx="53" cy="51" rx="5" ry="3" fill="rgba(255,130,160,0.35)" />
      <circle cx="33" cy="44" r="4.5" fill="#1C1C1E" />
      <circle cx="47" cy="44" r="4.5" fill="#1C1C1E" />
      <circle cx="34.5" cy="42.5" r="1.8" fill="white" />
      <circle cx="48.5" cy="42.5" r="1.8" fill="white" />
      <line x1="30" y1="40" x2="28" y2="37" stroke="#1C1C1E" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="33" y1="39.5" x2="33" y2="36" stroke="#1C1C1E" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="47" y1="39.5" x2="47" y2="36" stroke="#1C1C1E" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="40" x2="52" y2="37" stroke="#1C1C1E" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 33 55 Q 40 62 47 55" stroke="#C07080" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <line x1="60" y1="22" x2="64" y2="38" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="21" r="2.5" fill="#FBBF24" />
    </>
  )
}

function ElioAvatar({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#047857" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE8D0" />
          <stop offset="100%" stopColor="#F0C8A4" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${id}-bg)`} />
      <ellipse cx="28" cy="20" rx="14" ry="9" fill="rgba(255,255,255,0.38)" />
      <ellipse cx="40" cy="24" rx="20" ry="14" fill="#1A0E05" />
      <ellipse cx="40" cy="47" rx="18" ry="21" fill={`url(#${id}-face)`} />
      <path d="M 29 39 L 37 38" stroke="#3B2314" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 43 38 L 51 39" stroke="#3B2314" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="33" cy="44" r="4.5" fill="#1C1C1E" />
      <circle cx="47" cy="44" r="4.5" fill="#1C1C1E" />
      <circle cx="34.5" cy="42.5" r="1.8" fill="white" />
      <circle cx="48.5" cy="42.5" r="1.8" fill="white" />
      <path d="M 33 55 Q 40 63 47 55" stroke="#8B5E3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <polygon points="40,62 36,68 40,76 44,68" fill="#10B981" />
      <polygon points="40,62 36,64 37,62 40,60 43,62 44,64" fill="#065F46" />
      <path d="M 28 65 L 36 62 L 40 65 L 44 62 L 52 65" stroke="#f0f0f0" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  )
}

function MaeAvatar({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE8D0" />
          <stop offset="100%" stopColor="#F4C9B4" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${id}-bg)`} />
      <ellipse cx="28" cy="20" rx="14" ry="9" fill="rgba(255,255,255,0.38)" />
      <circle cx="40" cy="18" r="12" fill="#2C1810" />
      <ellipse cx="40" cy="28" rx="20" ry="12" fill="#2C1810" />
      <ellipse cx="40" cy="18" rx="13" ry="4" fill="#F59E0B" />
      <ellipse cx="40" cy="47" rx="18" ry="21" fill={`url(#${id}-face)`} />
      <ellipse cx="27" cy="52" rx="5" ry="3" fill="rgba(255,160,80,0.35)" />
      <ellipse cx="53" cy="52" rx="5" ry="3" fill="rgba(255,160,80,0.35)" />
      <circle cx="33" cy="45" r="4.5" fill="#1C1C1E" />
      <circle cx="47" cy="45" r="4.5" fill="#1C1C1E" />
      <circle cx="34.5" cy="43.5" r="1.8" fill="white" />
      <circle cx="48.5" cy="43.5" r="1.8" fill="white" />
      <path d="M 34 56 Q 40 62 46 56" stroke="#C07A50" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <rect x="30" y="66" width="20" height="12" rx="2" fill="#F59E0B" opacity="0.9" />
      <path d="M 30 66 L 40 73 L 50 66" stroke="#92400E" strokeWidth="1.5" fill="none" />
    </>
  )
}

function MaxAvatar({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#BE185D" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE8D0" />
          <stop offset="100%" stopColor="#F4C9B4" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${id}-bg)`} />
      <ellipse cx="28" cy="20" rx="14" ry="9" fill="rgba(255,255,255,0.38)" />
      <path d="M 20 30 Q 22 12 40 10 Q 58 12 60 30 Q 55 16 52 14 L 48 22 L 44 10 L 40 18 L 36 10 L 32 22 L 28 14 Q 25 16 20 30" fill="#1A0A14" />
      <ellipse cx="40" cy="47" rx="18" ry="21" fill={`url(#${id}-face)`} />
      <circle cx="33" cy="45" r="4.5" fill="#1C1C1E" />
      <path d="M 43 43 L 51 43" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="34.5" cy="43.5" r="1.8" fill="white" />
      <circle cx="47" cy="45" r="5" fill="#1C1C1E" />
      <circle cx="47" cy="45" r="3" fill="#EC4899" />
      <circle cx="47" cy="45" r="1.5" fill="#1C1C1E" />
      <circle cx="48" cy="43.5" r="0.8" fill="white" />
      <path d="M 32 57 Q 40 64 48 57" stroke="#BE185D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="28" y="66" width="24" height="14" rx="3" fill="#1C1C1E" />
      <circle cx="40" cy="73" r="5" fill="#EC4899" />
      <circle cx="40" cy="73" r="3" fill="#1C1C1E" />
      <rect x="50" y="68" width="4" height="3" rx="1" fill="#EC4899" />
    </>
  )
}

function NovaAvatar({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#A5B4FC" />
          <stop offset="100%" stopColor="#4338CA" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#EDE8FF" />
          <stop offset="100%" stopColor="#D4C8F8" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${id}-bg)`} />
      <ellipse cx="28" cy="20" rx="14" ry="9" fill="rgba(255,255,255,0.38)" />
      <path d="M 19 35 Q 20 12 40 10 Q 60 12 61 35 Q 62 22 56 15 Q 50 10 40 10 Q 30 10 24 15 Q 18 22 19 35" fill="#0F0A1E" />
      <ellipse cx="40" cy="47" rx="18" ry="21" fill={`url(#${id}-face)`} />
      <path d="M 29 38 Q 33 36 37 38" stroke="#2E1065" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 43 38 Q 47 36 51 38" stroke="#2E1065" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="33" cy="44" r="4.5" fill="#1C1C1E" />
      <circle cx="47" cy="44" r="4.5" fill="#1C1C1E" />
      <circle cx="34.5" cy="42.5" r="1.8" fill="#6366F1" />
      <circle cx="48.5" cy="42.5" r="1.8" fill="#6366F1" />
      <circle cx="35" cy="42" r="0.8" fill="white" />
      <circle cx="49" cy="42" r="0.8" fill="white" />
      <path d="M 35 55 Q 40 59 45 55" stroke="#4338CA" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 40 28 L 41.5 31 L 44.5 31 L 42 33 L 43 36 L 40 34 L 37 36 L 38 33 L 35.5 31 L 38.5 31 Z" fill="#818CF8" opacity="0.85" />
    </>
  )
}

function AlbaAvatar({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#DDD6FE" />
          <stop offset="100%" stopColor="#7C3AED" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE8D0" />
          <stop offset="100%" stopColor="#F4C9B4" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${id}-bg)`} />
      <ellipse cx="28" cy="20" rx="14" ry="9" fill="rgba(255,255,255,0.38)" />
      <path d="M 18 40 Q 18 12 40 10 Q 62 12 62 40 Q 64 55 60 62 L 57 55 Q 60 45 60 38 Q 58 20 40 18 Q 22 20 20 38 Q 20 45 23 55 L 20 62 Q 16 55 18 40" fill="#2C1810" />
      <ellipse cx="40" cy="46" rx="18" ry="21" fill={`url(#${id}-face)`} />
      <ellipse cx="27" cy="51" rx="5" ry="3" fill="rgba(200,100,200,0.25)" />
      <ellipse cx="53" cy="51" rx="5" ry="3" fill="rgba(200,100,200,0.25)" />
      <circle cx="33" cy="44" r="4.5" fill="#1C1C1E" />
      <circle cx="47" cy="44" r="4.5" fill="#1C1C1E" />
      <circle cx="34.5" cy="42.5" r="1.8" fill="white" />
      <circle cx="48.5" cy="42.5" r="1.8" fill="white" />
      <path d="M 33 55 Q 40 62 47 55" stroke="#C07A50" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <rect x="52" y="58" width="14" height="18" rx="2" fill="#C4B5FD" />
      <rect x="54" y="56" width="10" height="5" rx="2" fill="#7C3AED" />
      <line x1="55" y1="65" x2="64" y2="65" stroke="#7C3AED" strokeWidth="1.5" />
      <line x1="55" y1="69" x2="64" y2="69" stroke="#7C3AED" strokeWidth="1.5" />
      <line x1="55" y1="72" x2="60" y2="72" stroke="#7C3AED" strokeWidth="1.5" />
    </>
  )
}

function OrionAvatar({ id }: { id: string }) {
  const gearAngles = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#3F4F61" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${id}-bg)`} />
      <ellipse cx="28" cy="20" rx="14" ry="9" fill="rgba(255,255,255,0.38)" />
      <path d="M 18 35 Q 19 10 40 9 Q 61 10 62 35 Q 63 20 60 15 Q 52 8 40 8 Q 28 8 20 15 Q 17 20 18 35" fill="#1E293B" />
      <rect x="20" y="22" width="40" height="16" rx="8" fill="#0F172A" opacity="0.9" />
      <rect x="22" y="24" width="36" height="12" rx="6" fill="#0EA5E9" opacity="0.3" />
      <ellipse cx="40" cy="50" rx="17" ry="19" fill={`url(#${id}-face)`} />
      <rect x="28" y="40" width="10" height="7" rx="2" fill="#1E293B" />
      <rect x="42" y="40" width="10" height="7" rx="2" fill="#1E293B" />
      <rect x="30" y="42" width="6" height="3" rx="1" fill="#38BDF8" />
      <rect x="44" y="42" width="6" height="3" rx="1" fill="#38BDF8" />
      <rect x="31" y="54" width="18" height="4" rx="2" fill="#1E293B" />
      <rect x="33" y="55.5" width="3" height="1" rx="0.5" fill="#38BDF8" />
      <rect x="38" y="55.5" width="3" height="1" rx="0.5" fill="#38BDF8" />
      <rect x="43" y="55.5" width="3" height="1" rx="0.5" fill="#38BDF8" />
      <circle cx="65" cy="62" r="8" fill="#334155" />
      <circle cx="65" cy="62" r="4" fill="#64748B" />
      {gearAngles.map((angle) => (
        <rect
          key={angle}
          x="63"
          y="52"
          width="4"
          height="4"
          rx="1"
          fill="#334155"
          transform={`rotate(${angle} 65 62)`}
        />
      ))}
    </>
  )
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, [string, string]> = {
  marine: ["#7EF0F0", "#0891B2"],
  charles: ["#C4B5FD", "#6D28D9"],
  lou: ["#FBCFE8", "#DB2777"],
  elio: ["#6EE7B7", "#047857"],
  mae: ["#FDE68A", "#D97706"],
  max: ["#F9A8D4", "#BE185D"],
  nova: ["#A5B4FC", "#3730A3"],
  alba: ["#DDD6FE", "#7C3AED"],
  orion: ["#CBD5E1", "#334155"],
}

function FallbackAvatar({ slug, id }: { slug: string; id: string }) {
  const [light, dark] = AGENT_COLORS[slug] ?? ["#F4956E", "#E86F4D"]
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${id}-bg)`} />
      <ellipse cx="28" cy="20" rx="14" ry="9" fill="rgba(255,255,255,0.35)" />
      <text
        x="40" y="47"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="28"
        fontWeight="800"
        fill="white"
        fontFamily="system-ui, sans-serif"
      >
        {(slug[0] ?? "?").toUpperCase()}
      </text>
    </>
  )
}

// ─── Avatar map ────────────────────────────────────────────────────────────────

const AVATAR_MAP: Record<string, React.FC<{ id: string }>> = {
  marine: MarineAvatar,
  charles: CharlesAvatar,
  lou: LouAvatar,
  elio: ElioAvatar,
  mae: MaeAvatar,
  max: MaxAvatar,
  nova: NovaAvatar,
  alba: AlbaAvatar,
  orion: OrionAvatar,
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AgentAvatar({
  slug,
  size = 40,
  glow = false,
  className,
  style,
}: AgentAvatarProps) {
  const uid = useId().replace(/:/g, "")
  const id = `av-${slug}-${uid}`
  const AvatarContent = AVATAR_MAP[slug]
  const agentColor = (AGENT_COLORS[slug] ?? ["#F4956E", "#E86F4D"])[1]

  // Charles est l'agent orchestrateur (chef d'équipe) → couronne dorée affichée
  // partout où son avatar apparaît. Skip sur les très petits avatars (illisible)
  const isOrchestrator = slug === "charles"
  const showCrown = isOrchestrator && size >= 18
  const crownSize = Math.max(12, Math.round(size * 0.42))

  return (
    <div
      className={className}
      role="img"
      aria-label={isOrchestrator ? `Avatar ${slug} (orchestrateur)` : `Avatar ${slug}`}
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Clipper rond qui contient le SVG du visage */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: glow
            ? `0 0 0 2px ${agentColor}30, 0 6px 20px ${agentColor}35, 0 2px 6px rgba(0,0,0,0.4)`
            : "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        <svg
          viewBox="0 0 80 80"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block" }}
        >
          {AvatarContent ? (
            <AvatarContent id={id} />
          ) : (
            <FallbackAvatar slug={slug} id={id} />
          )}
        </svg>
      </div>

      {/* Couronne dorée — réservée à Charles (agent orchestrateur Lynaris) */}
      {showCrown && (
        <svg
          viewBox="0 0 24 18"
          width={crownSize}
          height={Math.round(crownSize * 0.75)}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
          style={{
            position: "absolute",
            top: -Math.round(size * 0.18),
            left: "50%",
            transform: "translateX(-50%) rotate(-12deg)",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5)) drop-shadow(0 0 4px rgba(251,191,36,0.55))",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          {/* Corps de la couronne — 3 pointes + base */}
          <path
            d="M2 14 L4 5 L8 9 L12 2 L16 9 L20 5 L22 14 Z"
            fill="#FBBF24"
            stroke="#92400E"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          {/* Base ouvrée */}
          <rect x="2" y="14" width="20" height="3" rx="0.5" fill="#F59E0B" stroke="#92400E" strokeWidth="0.4" />
          {/* Bijoux sur les pointes */}
          <circle cx="4" cy="5" r="1" fill="#EF4444" stroke="#7F1D1D" strokeWidth="0.3" />
          <circle cx="12" cy="2.2" r="1.1" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="0.3" />
          <circle cx="20" cy="5" r="1" fill="#10B981" stroke="#065F46" strokeWidth="0.3" />
          {/* Reflets dorés */}
          <ellipse cx="9" cy="11" rx="0.8" ry="1.2" fill="rgba(255,255,255,0.5)" />
          <ellipse cx="15" cy="11" rx="0.8" ry="1.2" fill="rgba(255,255,255,0.3)" />
        </svg>
      )}
    </div>
  )
}

export default AgentAvatar
