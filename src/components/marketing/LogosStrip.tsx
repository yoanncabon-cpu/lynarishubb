export function LogosStrip() {
  return (
    <section
      className="relative"
      style={{
        padding: "40px 32px 64px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
      aria-label="Rejoins nos premiers clients"
    >
      <div className="mx-auto max-w-7xl">
        <p style={{ textAlign: "center", color: "#52525B", fontSize: 13 }}>
          Rejoins nos premiers clients.{" "}
          <a href="/contact" style={{ color: "#E86F4D", textDecoration: "none" }}>
            Réserver une démo →
          </a>
        </p>
      </div>
    </section>
  )
}
