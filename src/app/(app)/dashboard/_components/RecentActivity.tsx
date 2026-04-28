"use client"

import { AgentAvatar } from "@/components/shared/AgentAvatar"

interface ActivityItem {
  agent: string
  agentColor: string
  label: string
  detail: string
  time: string
}

const activities: ActivityItem[] = [
  {
    agent: "Marine",
    agentColor: "#22D3EE",
    label: "Appel géré",
    detail: "RDV créé pour Mme Rousseau — jeudi 9h30",
    time: "il y a 12 min",
  },
  {
    agent: "Lou",
    agentColor: "#F472B6",
    label: "Post publié",
    detail: "LinkedIn : 'L'IA en cabinet médical'",
    time: "il y a 1 h",
  },
  {
    agent: "Mae",
    agentColor: "#F59E0B",
    label: "Email envoyé",
    detail: "Rappel facture Dubois & Associés",
    time: "il y a 2 h",
  },
  {
    agent: "Elio",
    agentColor: "#10B981",
    label: "Prospect qualifié",
    detail: "Thomas Perrin — score 82/100",
    time: "il y a 3 h",
  },
  {
    agent: "Max",
    agentColor: "#EC4899",
    label: "Visuels générés",
    detail: "8 variations logo Lynaris sur fond sombre",
    time: "il y a 5 h",
  },
]

export function RecentActivity() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#F5EFE6",
            margin: 0,
          }}
        >
          Activité récente
        </h2>
        <span style={{ fontSize: 12, color: "#71717A" }}>{"Aujourd'hui"}</span>
      </div>

      <div
        style={{
          background: "#161618",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {activities.map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 16px",
              borderBottom:
                i < activities.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.background =
                "rgba(255,255,255,0.02)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.background = "transparent"
            }}
          >
            <AgentAvatar slug={a.agent.toLowerCase()} size={28} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#F5EFE6" }}>
                  {a.label}
                </span>
                <span style={{ fontSize: 11, color: "#71717A" }}>par {a.agent}</span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#A1A1AA",
                  margin: "2px 0 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {a.detail}
              </p>
            </div>

            <span
              style={{
                fontSize: 11,
                color: "#71717A",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {a.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
