import { LynarisLogo } from "@/components/shared/LynarisLogo"

export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement"
      style={{
        minHeight: "100dvh",
        background: "#0C0C0F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      <div style={{ animation: "glPulse 2s ease-in-out infinite" }}>
        <LynarisLogo size={52} showWordmark />
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(232,111,77,0.6)",
              display: "inline-block",
              animation: "glBounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes glPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
        @keyframes glBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-7px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] * { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
