"use client"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StreamingMessageBubbleProps {
  content: string
  role: "user" | "assistant"
  isStreaming?: boolean
  agentName?: string
  agentColor?: string
}

export function StreamingMessageBubble({
  content,
  role,
  isStreaming = false,
  agentName,
  agentColor = "#A78BFA",
}: StreamingMessageBubbleProps) {
  const isUser = role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
          style={{ backgroundColor: `${agentColor}20`, color: agentColor, border: `1px solid ${agentColor}30` }}
        >
          {agentName?.[0] ?? "A"}
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-[--ly-primary] text-white rounded-tr-sm"
            : "bg-[--ly-surface] border border-[--ly-border] text-[--ly-text] rounded-tl-sm"
        )}
      >
        {content}
        {isStreaming && (
          <span className="inline-block ml-1 h-4 w-0.5 bg-current animate-pulse rounded-full" aria-hidden />
        )}
      </div>
    </motion.div>
  )
}
