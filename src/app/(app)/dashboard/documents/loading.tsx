export default function DocumentsLoading() {
  return (
    <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} style={{ height: 160, borderRadius: 14, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*60}ms` }} />
      ))}
    </div>
  )
}
