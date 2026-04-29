import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

type DbInstance = ReturnType<typeof drizzle<typeof schema>>

/**
 * Crée le client postgres-js + drizzle.
 * - max: 1 connexion par instance Next.js (Supabase transaction pooler
 *   gère le multiplexing, on n'a pas besoin de pool côté app)
 * - prepare: false (incompatible avec le pooler en mode transaction)
 * - idle_timeout: 20s (libère les connexions idle rapidement)
 */
function createDb(): DbInstance {
  const connectionString = process.env["DATABASE_URL"]
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — add it to .env.local")
  }
  const client = postgres(connectionString, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return drizzle(client, { schema })
}

// ─── HMR-safe singleton ──────────────────────────────────────────────────────
//
// En dev Next.js, chaque modif de fichier déclenche un hot module reload qui
// ré-évalue ce module. Sans cache global, chaque reload crée un nouveau client
// postgres + 10 connexions, et les anciennes ne sont jamais fermées → on
// sature très vite le pool Supabase ("too many clients already").
//
// Solution : stocker l'instance dans globalThis. Le globalThis survit au HMR.

interface GlobalWithDb {
  __lynaris_db?: DbInstance
}
const g = globalThis as unknown as GlobalWithDb

function getDb(): DbInstance {
  if (!g.__lynaris_db) {
    g.__lynaris_db = createDb()
  }
  return g.__lynaris_db
}

export const db = new Proxy({} as DbInstance, {
  get(_target, prop) {
    const inst = getDb()
    const value = (inst as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === "function") return value.bind(inst)
    return value
  },
})

export type Db = typeof db
