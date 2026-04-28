import { type NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
})

export async function POST(request: NextRequest) {
  let body: { message: string; context?: string }
  try {
    body = (await request.json()) as { message: string; context?: string }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.message)
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    )

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `You are a B2B sales expert. Score this reply from a prospect on a scale of 0-100.
Return ONLY a JSON object: {"score": number, "category": "hot"|"warm"|"cold"|"negative", "reasoning": "one sentence"}

Prospect reply: "${body.message}"
${body.context ? `Context: ${body.context}` : ""}`,
      },
    ],
  })

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")

  try {
    const result = JSON.parse(text) as {
      score: number
      category: string
      reasoning: string
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({
      score: 50,
      category: "warm",
      reasoning: "Could not parse scoring",
    })
  }
}
