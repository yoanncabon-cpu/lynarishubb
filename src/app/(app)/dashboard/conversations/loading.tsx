export default function ConversationsLoading() {
  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      <div style={{ width: 280, borderRight: "1px solid rgba(255,255,255,0.06)", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ height: 64, borderRadius: 12, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*60}ms` }} />
        ))}
      </div>
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 60, borderRadius: 12, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*80}ms` }} />)}
      </div>
    </div>
  )
}
