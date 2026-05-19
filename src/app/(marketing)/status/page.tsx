import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Statut des services — Lynaris",
  description: "État en temps réel des services Lynaris : API, agents, voix, dashboard.",
  robots: { index: true, follow: true },
}

const components = [
  {
    name: "API Agents",
    description: "Exécution et orchestration des agents IA",
    status: "operational" as const,
  },
  {
    name: "Agent Vocal (Marine)",
    description: "Décrochage téléphonique via Twilio + ElevenLabs",
    status: "operational" as const,
  },
  {
    name: "Dashboard",
    description: "Interface web et authentification",
    status: "operational" as const,
  },
  {
    name: "Webhooks",
    description: "Événements entrants et sortants",
    status: "operational" as const,
  },
  {
    name: "Intégrations (OAuth)",
    description: "Google, Stripe, LinkedIn, WordPress…",
    status: "operational" as const,
  },
  {
    name: "Emails & SMS",
    description: "Notifications via Resend et Twilio",
    status: "operational" as const,
  },
]

type Status = "operational" | "degraded" | "outage"

const statusConfig: Record<Status, { label: string; color: string; dot: string }> = {
  operational: {
    label: "Opérationnel",
    color: "#10B981",
    dot: "rgba(16,185,129,0.15)",
  },
  degraded: {
    label: "Dégradé",
    color: "#F59E0B",
    dot: "rgba(245,158,11,0.15)",
  },
  outage: {
    label: "Interruption",
    color: "#EF4444",
    dot: "rgba(239,68,68,0.15)",
  },
}

function StatusDot({ status }: { status: Status }) {
  const cfg = statusConfig[status]
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium"
      style={{ background: cfg.dot, color: cfg.color }}
    >
      <span
        className="h-2 w-2 rounded-full flex-shrink-0"
        style={{
          background: cfg.color,
          boxShadow: `0 0 0 3px ${cfg.dot}`,
        }}
        aria-hidden
      />
      {cfg.label}
    </span>
  )
}

const allOperational = components.every((c) => c.status === "operational")

export default function StatusPage() {
  return (
    <main className="min-h-screen py-24 px-4">
      <div className="mx-auto max-w-2xl">
        {/* En-tête */}
        <div className="mb-12 text-center space-y-4">
          <Link
            href="/"
            className="inline-block text-[13px] text-[#71717A] hover:text-[#F5F5F7] transition-colors mb-4"
          >
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl font-bold text-[#F5F5F7] tracking-tight">
            Statut des services
          </h1>
          <div
            className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5"
            style={{
              background: allOperational ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
              border: `1px solid ${allOperational ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
            }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: allOperational ? "#10B981" : "#F59E0B",
                boxShadow: `0 0 0 4px ${allOperational ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)"}`,
              }}
              aria-hidden
            />
            <span
              className="text-[14px] font-semibold"
              style={{ color: allOperational ? "#10B981" : "#F59E0B" }}
            >
              {allOperational
                ? "Tous les services sont opérationnels"
                : "Certains services sont dégradés"}
            </span>
          </div>
        </div>

        {/* Liste des composants */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {components.map((component, i) => (
            <div
              key={component.name}
              className="flex items-center justify-between px-5 py-4 gap-4"
              style={{
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : undefined,
              }}
            >
              <div>
                <p className="text-[14px] font-semibold text-[#F5F5F7]">
                  {component.name}
                </p>
                <p className="text-[12px] text-[#71717A] mt-0.5">
                  {component.description}
                </p>
              </div>
              <StatusDot status={component.status} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[12px] text-[#52525B]">
          Dernière mise à jour : en temps réel · Incidents :{" "}
          <a href="mailto:support@lynaris.ai" className="text-[#71717A] hover:text-[#F5F5F7] transition-colors">
            support@lynaris.ai
          </a>
        </p>
      </div>
    </main>
  )
}
