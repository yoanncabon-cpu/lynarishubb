export default function IntegrationsLoading() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ height: 44, width: 320, borderRadius: 10, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} style={{ height: 120, borderRadius: 16, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*50}ms` }} />
        ))}
      </div>
    </div>
  )
}
