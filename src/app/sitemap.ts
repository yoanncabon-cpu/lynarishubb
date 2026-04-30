import type { MetadataRoute } from "next"
import { getAppUrl } from "@/lib/app-url"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl()
  const now = new Date()

  const marketingRoutes: Array<{
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
    priority: number
  }> = [
    { path: "/",               changeFrequency: "weekly",  priority: 1 },
    { path: "/tarifs",         changeFrequency: "monthly", priority: 0.6 },
    { path: "/agents",         changeFrequency: "monthly", priority: 0.6 },
    { path: "/a-propos",       changeFrequency: "monthly", priority: 0.6 },
    { path: "/contact",        changeFrequency: "monthly", priority: 0.6 },
    { path: "/blog",           changeFrequency: "monthly", priority: 0.6 },
    // Pages temporairement retirées du sitemap — voir noindex dans metadata
    // { path: "/cas-clients", ... }
    // { path: "/changelog", ... }
    // { path: "/carrieres", ... }
    // { path: "/presse", ... }
    { path: "/docs",           changeFrequency: "monthly", priority: 0.6 },
    { path: "/skills",         changeFrequency: "monthly", priority: 0.6 },
    { path: "/calculateur",    changeFrequency: "monthly", priority: 0.7 },
    // Vertical landing pages
    { path: "/pour/kinesitherapeutes", changeFrequency: "monthly", priority: 0.7 },
    { path: "/pour/restaurants",       changeFrequency: "monthly", priority: 0.7 },
    { path: "/pour/artisans",          changeFrequency: "monthly", priority: 0.7 },
    { path: "/pour/immobilier",        changeFrequency: "monthly", priority: 0.7 },
    { path: "/pour/cabinets-medicaux", changeFrequency: "monthly", priority: 0.7 },
    // Agent pages
    { path: "/agents/marine",  changeFrequency: "monthly", priority: 0.8 },
    { path: "/agents/charles", changeFrequency: "monthly", priority: 0.8 },
    { path: "/agents/lou",     changeFrequency: "monthly", priority: 0.8 },
    { path: "/agents/elio",    changeFrequency: "monthly", priority: 0.8 },
    { path: "/agents/mae",     changeFrequency: "monthly", priority: 0.8 },
    { path: "/agents/max",     changeFrequency: "monthly", priority: 0.8 },
    { path: "/agents/nova",    changeFrequency: "monthly", priority: 0.8 },
    { path: "/agents/alba",    changeFrequency: "monthly", priority: 0.8 },
    { path: "/agents/orion",   changeFrequency: "monthly", priority: 0.8 },
  ]

  return marketingRoutes.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
