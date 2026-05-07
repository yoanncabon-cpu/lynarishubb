export default function CrmLoading() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ height: 48, width: 240, borderRadius: 10, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite" }} />
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} style={{ height: 64, borderRadius: 10, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  )
}
