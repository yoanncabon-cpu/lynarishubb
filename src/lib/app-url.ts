import { logger } from "@/lib/logger"

/**
 * Source unique pour l'URL publique de l'application.
 *
 * Lit `NEXT_PUBLIC_APP_URL` depuis l'environnement. En dev, fallback sur
 * `http://localhost:3000`. En prod, log un warning si la var est absente
 * ou pointe encore sur localhost (config oubliée sur Vercel).
 *
 * Toujours retourner une string sans slash final pour pouvoir concaténer
 * `${getAppUrl()}/dashboard/billing` proprement.
 */
export function getAppUrl(): string {
  const raw = process.env["NEXT_PUBLIC_APP_URL"]
  const isProd = process.env["NODE_ENV"] === "production"

  // Si NEXT_PUBLIC_APP_URL est absent ou mal configuré (localhost en prod),
  // Vercel injecte automatiquement VERCEL_PROJECT_PRODUCTION_URL (prod)
  // et VERCEL_URL (branch/preview). On les utilise comme fallback fiable.
  const isInvalid = !raw || (isProd && raw.includes("localhost"))

  if (isInvalid) {
    const vercelProdUrl = process.env["VERCEL_PROJECT_PRODUCTION_URL"]
    const vercelUrl = process.env["VERCEL_URL"]
    const autoUrl = vercelProdUrl ?? vercelUrl

    if (autoUrl) {
      // VERCEL_URL ne contient pas le scheme — on l'ajoute
      return `https://${autoUrl.replace(/^https?:\/\//, "")}`
    }

    if (isProd) {
      logger.error("[app-url] NEXT_PUBLIC_APP_URL absent/localhost en prod et VERCEL_URL indisponible", {
        hint: "Configure NEXT_PUBLIC_APP_URL = https://ton-domaine.com dans Vercel → Settings → Environment Variables.",
      })
    }
    return "http://localhost:3000"
  }

  return raw.replace(/\/+$/, "")
}
