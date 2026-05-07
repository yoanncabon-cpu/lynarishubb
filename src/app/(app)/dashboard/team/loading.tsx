export default function TeamLoading() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 68, borderRadius: 12, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*70}ms` }} />
      ))}
    </div>
  )
}
