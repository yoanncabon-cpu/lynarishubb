type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  orgId?: string
  userId?: string
  route?: string
  requestId?: string
  [key: string]: unknown
}

function truncate(value: unknown): unknown {
  if (typeof value === "string" && value.length > 80) {
    return value.slice(0, 40) + "...(tronque)"
  }
  return value
}

function sanitize(ctx: LogContext): LogContext {
  const out: LogContext = {}
  for (const [k, v] of Object.entries(ctx)) {
    // Jamais de PII en clair dans les logs
    if (["password", "token", "secret", "key", "credential"].some(s => k.toLowerCase().includes(s))) {
      out[k] = "[REDACTED]"
    } else {
      out[k] = truncate(v)
    }
  }
  return out
}

function log(level: LogLevel, event: string, ctx?: LogContext): void {
  if (level === "debug" && process.env["NODE_ENV"] === "production") return

  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(ctx ? sanitize(ctx) : {}),
  }

  const line = JSON.stringify(entry)

  if (level === "error") {
    console.error(line)
  } else if (level === "warn") {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  debug: (event: string, ctx?: LogContext) => log("debug", event, ctx),
  info: (event: string, ctx?: LogContext) => log("info", event, ctx),
  warn: (event: string, ctx?: LogContext) => log("warn", event, ctx),
  error: (event: string, ctx?: LogContext) => log("error", event, ctx),
}
