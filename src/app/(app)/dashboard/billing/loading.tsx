export default function BillingLoading() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 100, borderRadius: 14, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      {[1, 2].map(i => (
        <div key={i} style={{ height: 140, borderRadius: 14, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  )
}
