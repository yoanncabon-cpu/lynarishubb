import { redirect } from "next/navigation"
import { agents } from "@/lib/agents/data"
import { AgentAvatar } from "@/components/shared/AgentAvatar"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { GlowCard } from "@/components/shared/GlowCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { NumberTickerClient } from "./_components/NumberTickerClient"
import { TypewriterClient } from "./_components/TypewriterClient"
import { StreamingBubbleClient } from "./_components/StreamingBubbleClient"

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/")
  }

  return (
    <div className="min-h-dvh bg-[--ly-bg] py-12">
      <div className="mx-auto max-w-5xl px-6 space-y-16">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[--ly-text]">Design System</h1>
            <p className="text-[--ly-text-muted] mt-1">
              Dev Only &mdash;{" "}
              <code className="text-[--ly-accent] text-sm">NODE_ENV=development</code>
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-[--ly-text-dim] hover:text-[--ly-text] transition-colors"
          >
            &larr; Retour home
          </Link>
        </div>

        {/* 1. Couleurs */}
        <section>
          <h2 className="text-xl font-bold text-[--ly-text] mb-6">Tokens couleurs</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              ["--ly-primary", "#7C3AED"],
              ["--ly-primary-soft", "#A78BFA"],
              ["--ly-accent", "#22D3EE"],
              ["--ly-bg", "#0A0A0F"],
              ["--ly-surface", "#14141C"],
              ["--ly-elevated", "#1E1E2A"],
              ["--ly-text", "#F5F5F7"],
              ["--ly-text-muted", "#A1A1AA"],
              ["--ly-text-dim", "#71717A"],
              ["--ly-success", "#10B981"],
              ["--ly-warning", "#F59E0B"],
              ["--ly-danger", "#EF4444"],
            ].map(([name, hex]) => (
              <div key={name} className="rounded-lg border border-[--ly-border] overflow-hidden">
                <div className="h-12" style={{ backgroundColor: hex }} />
                <div className="p-2">
                  <p className="text-xs font-mono text-[--ly-text-muted]">{name}</p>
                  <p className="text-xs text-[--ly-text-dim]">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* 2. Typography */}
        <section>
          <h2 className="text-xl font-bold text-[--ly-text] mb-6">Typographie</h2>
          <div className="space-y-4">
            <h1 className="text-[--ly-text]">H1 &mdash; Heading Display (64px)</h1>
            <h2 className="text-[--ly-text]">H2 &mdash; Section Title (40px)</h2>
            <h3 className="text-[--ly-text]">H3 &mdash; Card Title (28px)</h3>
            <h4 className="text-[--ly-text]">H4 &mdash; Subsection (22px)</h4>
            <p className="text-[--ly-text]">
              Body &mdash; Texte courant 16px avec line-height 1.6. Concu pour etre lisible sur
              fond sombre.
            </p>
            <p className="text-sm text-[--ly-text-muted]">
              Small muted &mdash; Labels, captions, metadonnees secondaires.
            </p>
            <p className="text-xs text-[--ly-text-dim]">
              XSmall dim &mdash; Timestamps, footnotes, disclaimers.
            </p>
            <p className="font-mono text-sm text-[--ly-text-muted]">
              Mono &mdash; Code snippets, IDs, logs systeme
            </p>
            <p
              className="gradient-text text-3xl font-bold"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              Gradient text &mdash; Lynaris
            </p>
          </div>
        </section>

        <Separator />

        {/* 3. Boutons */}
        <section>
          <h2 className="text-xl font-bold text-[--ly-text] mb-6">Boutons</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary" size="lg">
                Primary LG
              </Button>
              <Button variant="primary" size="md">
                Primary MD
              </Button>
              <Button variant="primary" size="sm">
                Primary SM
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="secondary" size="lg">
                Secondary LG
              </Button>
              <Button variant="secondary" size="md">
                Secondary MD
              </Button>
              <Button variant="ghost" size="md">
                Ghost
              </Button>
              <Button variant="danger" size="md">
                Danger
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="primary" size="md">
                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Loading...
              </Button>
            </div>
          </div>
        </section>

        <Separator />

        {/* 4. Inputs */}
        <section>
          <h2 className="text-xl font-bold text-[--ly-text] mb-6">Inputs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-[--ly-text-muted] mb-1.5">
                Input texte
              </label>
              <Input placeholder="Placeholder..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-[--ly-text-muted] mb-1.5">
                Input email
              </label>
              <Input type="email" placeholder="email@domaine.fr" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[--ly-text-muted] mb-1.5">
                Textarea
              </label>
              <Textarea placeholder="Decris ta demande en francais..." rows={3} />
            </div>
          </div>
        </section>

        <Separator />

        {/* 5. StatusBadge */}
        <section>
          <h2 className="text-xl font-bold text-[--ly-text] mb-6">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <StatusBadge variant="success" dot>
              Actif
            </StatusBadge>
            <StatusBadge variant="warning" dot>
              En pause
            </StatusBadge>
            <StatusBadge variant="danger" dot>
              Erreur
            </StatusBadge>
            <StatusBadge variant="info" dot>
              Nouveau
            </StatusBadge>
            <StatusBadge variant="default">Inactif</StatusBadge>
          </div>
        </section>

        <Separator />

        {/* 6. GlowCard */}
        <section>
          <h2 className="text-xl font-bold text-[--ly-text] mb-6">GlowCard</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlowCard glowColor="rgba(124,58,237,0.15)" className="p-5">
              <p className="font-semibold text-[--ly-text]">Violet glow</p>
              <p className="text-sm text-[--ly-text-muted] mt-1">Hover pour voir l&apos;effet</p>
            </GlowCard>
            <GlowCard glowColor="rgba(34,211,238,0.15)" className="p-5">
              <p className="font-semibold text-[--ly-text]">Cyan glow</p>
              <p className="text-sm text-[--ly-text-muted] mt-1">Agent Marine</p>
            </GlowCard>
            <GlowCard glowColor="rgba(16,185,129,0.15)" className="p-5">
              <p className="font-semibold text-[--ly-text]">Green glow</p>
              <p className="text-sm text-[--ly-text-muted] mt-1">Agent Elio</p>
            </GlowCard>
          </div>
        </section>

        <Separator />

        {/* 7. Agent Avatars */}
        <section>
          <h2 className="text-xl font-bold text-[--ly-text] mb-6">Agent Avatars</h2>
          <div className="flex flex-wrap gap-6 items-end">
            {agents.map((a) => (
              <div key={a.slug} className="flex flex-col items-center gap-2">
                <AgentAvatar slug={a.slug} name={a.name} color={a.color} size={48} />
                <span className="text-xs text-[--ly-text-dim]">{a.name}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-6 items-end">
            {[32, 48, 64, 80].map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <AgentAvatar slug="charles" name="Charles" color="#7C3AED" size={size} />
                <span className="text-xs text-[--ly-text-dim]">{size}px</span>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* 8. Skeleton */}
        <section>
          <h2 className="text-xl font-bold text-[--ly-text] mb-6">Skeleton Loading</h2>
          <div className="space-y-3 max-w-sm">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-3 mt-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* 9. Client components */}
        <section>
          <h2 className="text-xl font-bold text-[--ly-text] mb-6">Composants animes</h2>
          <div className="space-y-8">
            <div>
              <p className="text-sm text-[--ly-text-muted] mb-3">NumberTicker</p>
              <NumberTickerClient />
            </div>
            <div>
              <p className="text-sm text-[--ly-text-muted] mb-3">TypewriterText</p>
              <TypewriterClient />
            </div>
            <div>
              <p className="text-sm text-[--ly-text-muted] mb-3">StreamingMessageBubble</p>
              <StreamingBubbleClient />
            </div>
          </div>
        </section>

        <Separator />

        <div className="pb-12 text-center text-xs text-[--ly-text-dim]">
          Design System Lynaris v1.0 &mdash; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
