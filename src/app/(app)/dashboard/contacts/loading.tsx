export default function ContactsLoading() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ height: 44, borderRadius: 10, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", marginBottom: 8 }} />
      {[1,2,3,4,5,6,7].map(i => (
        <div key={i} style={{ height: 56, borderRadius: 10, background: "rgba(255,255,255,0.04)", animation: "skeleton-pulse 1.6s ease-in-out infinite", animationDelay: `${i*55}ms` }} />
      ))}
    </div>
  )
}
