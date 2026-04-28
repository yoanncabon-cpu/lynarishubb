const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256

function getEncryptionKey(): Promise<CryptoKey> {
  const rawKey = process.env["INTEGRATIONS_ENCRYPTION_KEY"]
  if (!rawKey) throw new Error("INTEGRATIONS_ENCRYPTION_KEY is not set")

  const keyBytes = Buffer.from(rawKey, "base64")
  if (keyBytes.length !== 32) {
    throw new Error("INTEGRATIONS_ENCRYPTION_KEY must be 32 bytes (256 bits) base64-encoded")
  }

  return crypto.subtle.importKey("raw", keyBytes, { name: ALGORITHM, length: KEY_LENGTH }, false, ["encrypt", "decrypt"])
}

export async function encryptCredentials(data: Record<string, unknown>): Promise<string> {
  const key = await getEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for AES-GCM
  const encoded = new TextEncoder().encode(JSON.stringify(data))

  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded)

  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return Buffer.from(combined).toString("base64")
}

export async function decryptCredentials<T = Record<string, unknown>>(encryptedBase64: string): Promise<T> {
  const key = await getEncryptionKey()
  const combined = Buffer.from(encryptedBase64, "base64")

  const iv = combined.subarray(0, 12)
  const data = combined.subarray(12)

  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data)
  const text = new TextDecoder().decode(decrypted)
  return JSON.parse(text) as T
}

export function generateHmacSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Buffer.from(bytes).toString("hex")
}

export async function signHmac(payload: string, secret: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(secret)
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const msgBytes = new TextEncoder().encode(payload)
  const sig = await crypto.subtle.sign("HMAC", key, msgBytes)
  return Buffer.from(sig).toString("hex")
}

export async function verifyHmac(payload: string, secret: string, signature: string): Promise<boolean> {
  const expected = await signHmac(payload, secret)
  // Constant-time comparison
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}
