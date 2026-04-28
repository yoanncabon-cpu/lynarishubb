"use client"

/**
 * Calque "aurora" — 5 halos colorés flous animés avec mouvements organiques.
 * Auto-désactivé en `prefers-reduced-motion` / `prefers-reduced-transparency`.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="lg-aurora">
      <div className="lg-aurora__blob lg-aurora__blob--orange" />
      <div className="lg-aurora__blob lg-aurora__blob--violet" />
      <div className="lg-aurora__blob lg-aurora__blob--blue" />
      <div className="lg-aurora__blob lg-aurora__blob--green" />
      <div className="lg-aurora__blob lg-aurora__blob--rose" />
    </div>
  )
}
