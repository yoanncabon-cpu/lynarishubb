import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

function createDb() {
  const connectionString = process.env["DATABASE_URL"]
  if (!connectionString) {
    // Throw at call-time (not module-load time) so build doesn't crash
    throw new Error("DATABASE_URL is not set — add it to .env.local")
  }
  // Disable prefetch: not supported in Supabase transaction mode pooler
  const client = postgres(connectionString, { prepare: false })
  return drizzle(client, { schema })
}

// Lazy singleton — initialised on first use, not at import time
let _db: ReturnType<typeof createDb> | undefined

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!_db) _db = createDb()
    const value = (_db as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === "function") return value.bind(_db)
    return value
  },
})

export type Db = typeof db
