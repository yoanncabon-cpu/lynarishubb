/**
 * Multi-provider streaming wrappers.
 * Tool use is only supported on Claude (Anthropic). OpenAI and Gemini return
 * plain text chunks only — no tool execution loop.
 */

export type ProviderMessage = { role: "user" | "assistant"; content: string }

// ── Detect provider from model ID ─────────────────────────────────────────────

export function detectProvider(model: string): "anthropic" | "openai" | "gemini" {
  if (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3")) return "openai"
  if (model.startsWith("gemini-")) return "gemini"
  return "anthropic"
}

// ── OpenAI streaming ──────────────────────────────────────────────────────────

export async function* streamOpenAI(
  model: string,
  systemPrompt: string,
  messages: ProviderMessage[],
): AsyncGenerator<string> {
  const apiKey = process.env["OPENAI_API_KEY"]
  if (!apiKey) throw new Error("OPENAI_API_KEY non configuré dans .env.local")

  const body = {
    model,
    stream: true,
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    let msg = `OpenAI ${res.status}`
    try { msg = (JSON.parse(err) as { error?: { message?: string } }).error?.message ?? msg } catch { /* */ }
    throw new Error(msg)
  }

  if (!res.body) throw new Error("OpenAI stream body vide")

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const raw = line.slice(6).trim()
      if (raw === "[DONE]") return
      try {
        const parsed = JSON.parse(raw) as {
          choices?: Array<{ delta?: { content?: string | null } }>
        }
        const chunk = parsed.choices?.[0]?.delta?.content
        if (chunk) yield chunk
      } catch { /* skip malformed */ }
    }
  }
}

// ── Gemini streaming ──────────────────────────────────────────────────────────

interface GeminiPart { text: string }
interface GeminiContent { role: "user" | "model"; parts: GeminiPart[] }

function toGeminiMessages(messages: ProviderMessage[]): GeminiContent[] {
  return messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))
}

export async function* streamGemini(
  model: string,
  systemPrompt: string,
  messages: ProviderMessage[],
): AsyncGenerator<string> {
  const apiKey = process.env["GEMINI_API_KEY"]
  if (!apiKey) throw new Error("GEMINI_API_KEY non configuré dans .env.local")

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: toGeminiMessages(messages),
    generationConfig: { maxOutputTokens: 8192 },
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    let msg = `Gemini ${res.status}`
    try {
      msg = (JSON.parse(err) as { error?: { message?: string } }).error?.message ?? msg
    } catch { /* */ }
    throw new Error(msg)
  }

  if (!res.body) throw new Error("Gemini stream body vide")

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const raw = line.slice(6).trim()
      try {
        const parsed = JSON.parse(raw) as {
          candidates?: Array<{ content?: { parts?: GeminiPart[] } }>
        }
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) yield text
      } catch { /* skip */ }
    }
  }
}
