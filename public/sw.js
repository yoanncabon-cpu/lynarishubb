// Lynaris Service Worker — Push notifications + PWA
const CACHE = "lynaris-v1"

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()))

// Reçoit un push du serveur et affiche la notification
self.addEventListener("push", e => {
  let data = { title: "Lynaris", body: "Nouvelle notification", icon: "/favicon.ico", url: "/dashboard" }
  try { if (e.data) data = { ...data, ...e.data.json() } } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon ?? "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: data.url ?? "/dashboard" },
      vibrate: [100, 50, 100],
    })
  )
})

// Clic sur notification → ouvre/focus l'app
self.addEventListener("notificationclick", e => {
  e.notification.close()
  const url = e.notification.data?.url ?? "/dashboard"
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
