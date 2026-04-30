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

  if (!raw) {
    if (isProd) {
      console.error(
        "[app-url] NEXT_PUBLIC_APP_URL absent en prod — fallback localhost. " +
          "Configure la variable dans Vercel → Settings → Environment Variables."
      )
    }
    return "http://localhost:3000"
  }

  if (isProd && raw.includes("localhost")) {
    console.error(
      "[app-url] NEXT_PUBLIC_APP_URL pointe sur localhost en prod. " +
        "Mets l'URL Vercel ou ton domaine custom (https://lynarisai.com)."
    )
  }

  return raw.replace(/\/+$/, "")
}
