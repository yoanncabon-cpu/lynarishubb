import Link from "next/link"
import { agents } from "@/lib/agents/data"
import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"

export const revalidate = 3600

// Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré
export const metadata: Metadata = {
  title: "Notre équipe IA",
  description:
    "Découvrez l'équipe IA Lynaris : téléphonie, contenu, prospection, mail, analytics, RH, automatisation et plus. Chaque agent est autonome et connecté à vos outils.",
}

export default function AgentsPage() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-[--ly-primary-soft]">
            Les agents
          </p>
          {/* Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[--ly-text] tracking-tight">
            Une équipe IA complète.
          </h1>
          <p className="text-lg text-[--ly-text-muted] max-w-2xl mx-auto">
            Chaque agent est spécialisé, autonome et connecté à tes outils.
            Active uniquement ceux dont tu as besoin.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Link
              key={agent.slug}
              href={`/agents/${agent.slug}`}
              className="group rounded-xl border border-[--ly-border] bg-[--ly-surface] p-6 hover:border-[--ly-border-hover] transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4"
            >
              {/* Icon + name */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: `${agent.color}20`,
                      border: `1px solid ${agent.color}30`,
                    }}
                  >
                    {agent.emoji}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[--ly-text]">{agent.name}</h2>
                    <p className="text-xs text-[--ly-text-dim]">{agent.role}</p>
                  </div>
                </div>
                {agent.available && (
                  <span className="flex items-center gap-1 text-xs text-[--ly-success]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[--ly-success]" />
                    Actif
                  </span>
                )}
              </div>

              {/* Tagline */}
              <p className="text-sm font-semibold" style={{ color: agent.color }}>
                {agent.tagline}
              </p>

              {/* Description */}
              <p className="text-sm text-[--ly-text-muted] leading-relaxed flex-1">
                {agent.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {agent.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${agent.color}15`,
                      color: agent.color,
                      border: `1px solid ${agent.color}25`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <span className="flex items-center gap-1 text-sm font-medium text-[--ly-text-muted] group-hover:text-[--ly-text] transition-colors">
                En savoir plus
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
