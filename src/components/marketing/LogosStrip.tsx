"use client"

import {
  Calendar,
  Mail,
  Globe,
  CreditCard,
  Phone,
  Mic,
  Link2,
  Camera,
  MessageSquare,
  BookOpen,
  ShoppingCart,
  Workflow,
  Cog,
  Send,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Tool {
  name: string
  icon: LucideIcon
}

const tools: Tool[] = [
  { name: "Google Calendar", icon: Calendar },
  { name: "Gmail", icon: Mail },
  { name: "WordPress", icon: Globe },
  { name: "Stripe", icon: CreditCard },
  { name: "Twilio", icon: Phone },
  { name: "ElevenLabs", icon: Mic },
  { name: "LinkedIn", icon: Link2 },
  { name: "Instagram", icon: Camera },
  { name: "Notion", icon: BookOpen },
  { name: "Shopify", icon: ShoppingCart },
  { name: "n8n", icon: Workflow },
  { name: "Make", icon: Cog },
  { name: "Resend", icon: Send },
  { name: "Slack", icon: MessageSquare },
]

function ToolPill({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 hover:border-white/16 transition-colors">
      <Icon className="h-3.5 w-3.5 text-[#71717A]" aria-hidden />
      <span className="whitespace-nowrap text-[13px] font-medium text-[#71717A]">
        {tool.name}
      </span>
    </div>
  )
}

const doubled = [...tools, ...tools]

export function LogosStrip() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        padding: "40px 0 48px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
      aria-label="Intégrations compatibles"
    >
      <style>{`
        @keyframes logos-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .logos-track:hover .logos-inner {
          animation-play-state: paused;
        }
      `}</style>

      <p className="mb-6 text-center text-[12px] font-semibold uppercase tracking-widest text-[#52525B]">
        S&apos;intègre à vos outils existants
      </p>

      <div
        className="logos-track flex [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        aria-hidden
      >
        <div
          className="logos-inner flex gap-3 shrink-0"
          style={{ animation: "logos-marquee 40s linear infinite" }}
        >
          {doubled.map((tool, i) => (
            <ToolPill key={`${tool.name}-${i}`} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  )
}
