"use client"

import { useEffect, useState, useRef } from "react"

interface TermLine {
  prefix: "$" | "⠋" | "✓"
  text: string
  delay: number
}

const terminalLines: TermLine[] = [
  { prefix: "$", text: "Publie un post LinkedIn sur l’offre kiné", delay: 0 },
  { prefix: "⠋", text: "Charles délègue à Lou…", delay: 1200 },
  { prefix: "✓", text: "Lou a rédigé 210 mots et généré le visuel", delay: 2800 },
  { prefix: "✓", text: "Publication planifiée — mardi 09 h 42", delay: 4200 },
  { prefix: "$", text: "Envoie aussi un SMS à Julien quand c’est en ligne", delay: 5800 },
  { prefix: "⠋", text: "Charles prépare Twilio…", delay: 7200 },
  { prefix: "✓", text: "SMS planifié : « Ton post LinkedIn est live �� »", delay: 8600 },
]

const prefixColors: Record<string, string> = {
  "$": "#A78BFA",
  "⠋": "#A1A1AA",
  "✓": "#10B981",
}

export function HeroTerminal() {
  const [displayedCount, setDisplayedCount] = useState(0)
  const [cycle, setCycle] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const resetTimer = setTimeout(() => setDisplayedCount(0), 0)
    timers.push(resetTimer)

    terminalLines.forEach((line, i) => {
      const t = setTimeout(() => {
        setDisplayedCount(i + 1)
      }, line.delay + 400)
      timers.push(t)
    })

    const lastDelay = terminalLines[terminalLines.length - 1]?.delay ?? 0
    const nextTimer = setTimeout(() => {
      setCycle((c) => c + 1)
    }, lastDelay + 4000)
    timers.push(nextTimer)

    return () => timers.forEach(clearTimeout)
  }, [cycle])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayedCount])

  return (
    <div className="relative rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-[0_0_80px_rgba(124,58,237,0.12),0_0_160px_rgba(124,58,237,0.04)]">
      {/* Noise grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06] z-20"
        aria-hidden
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Title bar macOS */}
      <div className="relative flex items-center px-4 py-3 border-b border-[rgba(255,255,255,0.08)] bg-[#1E1E2A]/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 text-xs text-[#71717A] font-mono tracking-tight">
          lynaris — charles
        </span>
      </div>

      {/* Terminal content */}
      <div
        ref={containerRef}
        className="relative overflow-y-auto scroll-smooth font-mono"
        style={{
          background: "#0D0D14",
          padding: "16px 18px",
          height: 320,
          lineHeight: 1.75,
          fontSize: 13,
        }}
        aria-live="polite"
        aria-label="Terminal Lynaris"
      >
        {terminalLines.slice(0, displayedCount).map((line, i) => (
          <div
            key={`${cycle}-${i}`}
            className="flex animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDuration: "300ms" }}
          >
            <span
              className="shrink-0 select-none"
              style={{
                width: 18,
                display: "inline-block",
                color: prefixColors[line.prefix] ?? "#A1A1AA",
              }}
            >
              {line.prefix}
            </span>
            <span style={{ color: "#A1A1AA" }}>{line.text}</span>
          </div>
        ))}

        {/* Blinking cursor */}
        <div className="flex" style={{ marginTop: displayedCount > 0 ? 0 : undefined }}>
          <span
            className="shrink-0 select-none"
            style={{
              width: 18,
              display: "inline-block",
              color: "#A78BFA",
            }}
          >
            $
          </span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 14,
              background: "#7C3AED",
              animation: "blink 1s step-end infinite",
              boxShadow: "0 0 6px rgba(124,58,237,0.6)",
              marginTop: 4,
            }}
            aria-hidden
          />
        </div>
      </div>

      {/* Footer bar */}
      <div className="relative px-4 py-2.5 border-t border-[rgba(255,255,255,0.08)] bg-[#1E1E2A]/60 backdrop-blur-sm flex items-center justify-between">
        {/* Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré */}
        <span className="text-xs text-[#71717A] font-mono tracking-tight">
          Équipe IA — tous agents actifs
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[#10B981]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]" />
          </span>
          En ligne
        </span>
      </div>
    </div>
  )
}
