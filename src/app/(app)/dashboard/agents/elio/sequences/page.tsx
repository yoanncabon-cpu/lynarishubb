import Link from "next/link"
import { ArrowLeft, Plus, Play, Pause, Mail, Clock, Users } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Séquences Elio | Lynaris" }

const mockSequences = [
  {
    // Mention "kinés Paris" + "cas client Ménigoz" retirée — pas d'accord de citation
    id: "1",
    name: "Prospection cabinets de soins",
    isActive: true,
    prospectsCount: 47,
    steps: [
      {
        dayOffset: 0,
        channel: "email",
        template: "Premier contact — cabinet de soins",
      },
      {
        dayOffset: 3,
        channel: "email",
        template: "Relance 1 — bénéfices clés",
      },
      {
        dayOffset: 7,
        channel: "email",
        template: "Relance 2 — démo gratuite",
      },
      { dayOffset: 14, channel: "email", template: "Dernière tentative" },
    ],
    stats: { sent: 47, opened: 31, replied: 12, converted: 3 },
  },
  {
    id: "2",
    name: "Cabinets comptables Île-de-France",
    isActive: false,
    prospectsCount: 23,
    steps: [
      {
        dayOffset: 0,
        channel: "email",
        template: "Premier contact — expertise comptable",
      },
      {
        dayOffset: 5,
        channel: "email",
        template: "Relance — ROI démontré",
      },
    ],
    stats: { sent: 23, opened: 18, replied: 4, converted: 1 },
  },
]

export default function SequencesPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/agents/elio"
            className="inline-flex items-center gap-1 text-sm text-[--ly-text-muted] hover:text-[--ly-text] transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Pipeline Elio
          </Link>
          <h1 className="text-xl font-bold text-[--ly-text]">
            Séquences de prospection
          </h1>
          <p className="text-sm text-[--ly-text-muted] mt-0.5">
            Automatisez vos relances multi-touch
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[--ly-primary] text-sm font-semibold text-white hover:bg-[--ly-primary-soft] transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden /> Nouvelle séquence
        </button>
      </div>

      <div className="space-y-4">
        {mockSequences.map((seq) => (
          <div
            key={seq.id}
            className="rounded-xl border border-[--ly-border] bg-[--ly-surface] p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-[--ly-text]">
                    {seq.name}
                  </h2>
                  <span
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                      seq.isActive
                        ? "bg-[--ly-success]/10 text-[--ly-success] border-[--ly-success]/20"
                        : "bg-[--ly-surface] text-[--ly-text-dim] border-[--ly-border]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        seq.isActive
                          ? "bg-[--ly-success]"
                          : "bg-[--ly-text-dim]"
                      }`}
                      aria-hidden
                    />
                    {seq.isActive ? "Active" : "En pause"}
                  </span>
                </div>
                <p className="text-sm text-[--ly-text-muted] mt-0.5 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" aria-hidden />{" "}
                  {seq.prospectsCount} prospects
                  <Clock className="h-3.5 w-3.5 ml-1" aria-hidden />{" "}
                  {seq.steps.length} étapes
                </p>
              </div>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-[--ly-border] flex items-center justify-center text-[--ly-text-muted] hover:text-[--ly-text] hover:border-[--ly-border-hover] transition-colors"
                aria-label={seq.isActive ? "Mettre en pause" : "Activer"}
              >
                {seq.isActive ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  label: "Envoyés",
                  value: String(seq.stats.sent),
                  color: "#A1A1AA",
                },
                {
                  label: "Ouverts",
                  value: `${Math.round((seq.stats.opened / seq.stats.sent) * 100)}\u00a0%`,
                  color: "#A78BFA",
                },
                {
                  label: "Réponses",
                  value: `${Math.round((seq.stats.replied / seq.stats.sent) * 100)}\u00a0%`,
                  color: "#22D3EE",
                },
                {
                  label: "Convertis",
                  value: String(seq.stats.converted),
                  color: "#10B981",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-[--ly-border] bg-[--ly-elevated] px-3 py-2 text-center"
                >
                  <p className="text-xs text-[--ly-text-dim]">{s.label}</p>
                  <p
                    className="text-base font-bold mt-0.5"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Steps timeline */}
            <div className="flex items-center gap-0 overflow-x-auto pb-1">
              {seq.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-0 shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-7 w-7 rounded-full bg-[--ly-elevated] border border-[--ly-border] flex items-center justify-center">
                      <Mail
                        className="h-3 w-3 text-[--ly-primary-soft]"
                        aria-hidden
                      />
                    </div>
                    <p className="text-[10px] text-[--ly-text-dim] text-center w-24 leading-tight">
                      {step.template}
                    </p>
                    {step.dayOffset > 0 && (
                      <p className="text-[10px] text-[--ly-text-dim]">
                        J+{step.dayOffset}
                      </p>
                    )}
                  </div>
                  {i < seq.steps.length - 1 && (
                    <div className="w-8 h-px bg-[--ly-border] mb-6 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
