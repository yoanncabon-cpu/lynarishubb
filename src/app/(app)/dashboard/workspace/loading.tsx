export default function WorkspaceLoading() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height: 100, borderRadius: 16, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*80}ms` }} />
      ))}
    </div>
  )
}
