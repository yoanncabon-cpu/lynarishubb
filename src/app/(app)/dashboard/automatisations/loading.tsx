export default function AutomatisationsLoading() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 40, width: 120, borderRadius: 10, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*60}ms` }} />)}
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height: 80, borderRadius: 14, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*80}ms` }} />
      ))}
    </div>
  )
}
