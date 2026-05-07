export default function SupportLoading() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 8 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 14, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*60}ms` }} />)}
      </div>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 72, borderRadius: 12, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*80}ms` }} />
      ))}
    </div>
  )
}
