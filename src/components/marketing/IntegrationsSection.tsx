"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
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
  Users,
  Pipette,
  ShoppingCart,
  Database,
  Workflow,
  Cog,
  Send,
  KanbanSquare,
  Search,
  MailOpen,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Integration {
  name: string
  icon: LucideIcon
}

const integrations: Integration[] = [
  { name: "Google Calendar", icon: Calendar },
  { name: "Gmail", icon: Mail },
  { name: "WordPress", icon: Globe },
  { name: "Stripe", icon: CreditCard },
  { name: "Twilio", icon: Phone },
  { name: "ElevenLabs", icon: Mic },
  { name: "LinkedIn", icon: Link2 },
  { name: "Instagram", icon: Camera },
  { name: "Slack", icon: MessageSquare },
  { name: "Notion", icon: BookOpen },
  { name: "HubSpot", icon: Users },
  { name: "Pipedrive", icon: Pipette },
  { name: "Shopify", icon: ShoppingCart },
  { name: "Airtable", icon: Database },
  { name: "n8n", icon: Workflow },
  { name: "Make", icon: Cog },
  { name: "Outlook", icon: MailOpen },
  { name: "Trello", icon: KanbanSquare },
  { name: "Resend", icon: Send },
  { name: "Dropcontact", icon: Search },
]

function MarqueePill({ integration }: { integration: Integration }) {
  const Icon = integration.icon
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-[--ly-border] bg-[--ly-surface] px-4 py-2.5 hover:border-[--ly-border-hover] transition-colors shrink-0">
      <Icon className="h-4 w-4 text-[--ly-primary-soft]" aria-hidden />
      <span className="text-sm font-medium text-[--ly-text] whitespace-nowrap">
        {integration.name}
      </span>
    </div>
  )
}

function MarqueeRow({
  items,
  reverse = false,
  duration = 25,
}: {
  items: Integration[]
  reverse?: boolean
  duration?: number
}) {
  const doubled = [...items, ...items]
  return (
    <div
      className="flex gap-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
      aria-hidden
    >
      <div
        className="flex gap-3 shrink-0"
        style={{
          animation: `marquee ${duration}s linear infinite${reverse ? " reverse" : ""}`,
        }}
      >
        {doubled.map((item, i) => (
          <MarqueePill key={`${item.name}-${i}`} integration={item} />
        ))}
      </div>
    </div>
  )
}

export function IntegrationsSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const firstRow = integrations.slice(0, 10)
  const secondRow = integrations.slice(10, 20)

  return (
    <section
      ref={ref}
      className="py-20 lg:py-28 overflow-hidden"
      aria-labelledby="integrations-heading"
    >
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .flex:hover > div[style*="animation"] {
          animation-play-state: paused;
        }
        [aria-hidden="true"]:hover div[style*="animation"] {
          animation-play-state: paused;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14 space-y-4"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-[--ly-primary-soft]">
            Intégrations
          </p>
          <h2
            id="integrations-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[--ly-text] tracking-tight"
          >
            Plus de 250 intégrations natives
          </h2>
          <p className="text-lg text-[--ly-text-muted] max-w-2xl mx-auto">
            Tes agents se connectent à tes outils existants. Pas de migration, pas de friction.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-3"
      >
        <MarqueeRow items={firstRow} duration={30} />
        <MarqueeRow items={secondRow} reverse duration={35} />
      </motion.div>
    </section>
  )
}
