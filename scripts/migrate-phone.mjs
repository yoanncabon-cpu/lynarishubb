import pg from "../node_modules/pg/lib/index.js"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(__dirname, "../supabase/migrations/0006_phone_numbers.sql"), "utf8")

const client = new pg.Client({
  connectionString: "postgresql://postgres:Yoann.C950410@db.wuadezvidxpzyjkmldba.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
})

await client.connect()
try {
  await client.query(sql)
  console.log("✓ Migration phone_numbers OK")
} catch (e) {
  if (e.message.includes("already exists")) {
    console.log("✓ Table phone_numbers existe déjà — skip")
  } else {
    console.error("✗ Migration error:", e.message)
    process.exit(1)
  }
} finally {
  await client.end()
}
