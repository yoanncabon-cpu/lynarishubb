"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import {
  Bot,
  LayoutDashboard,
  Plug,
  CreditCard,
  Settings,
  MessageSquare,
  BarChart3,
  Zap,
  Users,
} from "lucide-react"
import { agents } from "@/lib/agents/data"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const pages = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mes agents", href: "/dashboard/agents", icon: Bot },
  { label: "Intégrations", href: "/dashboard/integrations", icon: Plug },
  { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Équipe", href: "/dashboard/team", icon: Users },
  { label: "Facturation", href: "/dashboard/billing", icon: CreditCard },
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
] as const

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [router, onOpenChange]
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[--ly-border] bg-[--ly-elevated] shadow-2xl overflow-hidden">
        <Command
          className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-[--ly-border]"
          label="Palette de commandes"
        >
          <Command.Input
            placeholder="Rechercher un agent, une page, une action..."
            className="w-full h-12 px-4 bg-transparent text-sm text-[--ly-text] placeholder:text-[--ly-text-dim] outline-none"
            autoFocus
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-[--ly-text-dim]">
              Aucun résultat trouvé.
            </Command.Empty>

            <Command.Group
              heading="Agents"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[--ly-text-dim] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
            >
              {agents.map((agent) => (
                <Command.Item
                  key={agent.slug}
                  value={`agent ${agent.name} ${agent.slug}`}
                  onSelect={() => handleSelect(`/dashboard/agents/${agent.slug}`)}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-[--ly-text-muted] cursor-pointer data-[selected=true]:bg-[--ly-primary]/10 data-[selected=true]:text-[--ly-text] transition-colors"
                >
                  <div
                    className="h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: `${agent.color}20`,
                      color: agent.color,
                    }}
                  >
                    {agent.name[0]}
                  </div>
                  <div>
                    <span className="font-medium">{agent.name}</span>
                    <span className="ml-2 text-xs text-[--ly-text-dim]">{agent.role}</span>
                  </div>
                  <Zap
                    className="h-3 w-3 ml-auto shrink-0"
                    style={{ color: agent.color }}
                    aria-hidden="true"
                  />
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading="Pages"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[--ly-text-dim] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
            >
              {pages.map((page) => (
                <Command.Item
                  key={page.href}
                  value={`page ${page.label}`}
                  onSelect={() => handleSelect(page.href)}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-[--ly-text-muted] cursor-pointer data-[selected=true]:bg-[--ly-primary]/10 data-[selected=true]:text-[--ly-text] transition-colors"
                >
                  <div className="h-6 w-6 rounded-md bg-[--ly-surface] flex items-center justify-center shrink-0">
                    <page.icon
                      className="h-3.5 w-3.5 text-[--ly-text-dim]"
                      aria-hidden="true"
                    />
                  </div>
                  {page.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
