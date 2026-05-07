export default function CalendrierLoading() {
  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div style={{ height: 48, borderRadius: 10, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, flex: 1 }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 10, background: "rgba(255,255,255,0.03)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${(i % 7) * 50}ms` }} />
        ))}
      </div>
    </div>
  )
}
