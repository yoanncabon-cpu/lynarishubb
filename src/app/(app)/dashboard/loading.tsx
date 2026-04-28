/**
 * Loading minimal — affiché pendant la nav vers /dashboard/*.
 * Volontairement subtil (pas de skeleton complexe qui clignote) :
 * la barre de progression NavigationProgress (top) suffit à signaler le chargement.
 */
export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement de la page"
      style={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0,
        animation: "lgFadeIn 320ms ease-out 220ms forwards",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.10)",
          borderTopColor: "var(--accent)",
          animation: "lgSpin 0.7s linear infinite",
        }}
      />
      <style>{`
        @keyframes lgFadeIn {
          to { opacity: 1; }
        }
        @keyframes lgSpin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-label="Chargement de la page"] { opacity: 1 !important; animation: none !important; }
          [aria-label="Chargement de la page"] span { animation-duration: 1.4s !important; }
        }
      `}</style>
    </div>
  )
}
