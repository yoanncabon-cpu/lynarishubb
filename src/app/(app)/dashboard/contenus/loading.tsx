export default function ContenusLoading() {
  return (
    <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} style={{ height: 200, borderRadius: 16, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*70}ms` }} />
      ))}
    </div>
  )
}
