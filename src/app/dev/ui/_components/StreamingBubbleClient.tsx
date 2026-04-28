"use client"
import { StreamingMessageBubble } from "@/components/shared/StreamingMessageBubble"

export function StreamingBubbleClient() {
  return (
    <div className="max-w-md space-y-3">
      <StreamingMessageBubble
        role="user"
        content="Lou, r\u00e9dige un article sur l\u2019IA g\u00e9n\u00e9rative."
      />
      <StreamingMessageBubble
        role="assistant"
        agentName="Lou"
        agentColor="#F472B6"
        content="Sur le coup. Je lance la recherche de mots-cl\u00e9s et je commence la r\u00e9daction\u2026"
        isStreaming
      />
    </div>
  )
}
