"use server"

import { logger } from "@/lib/logger"
import { sendGmail } from "@/lib/emails/gmail"
import { agents } from "@/lib/agents/data"

// Rate limiting en mémoire (1 soumission / email / 10 min)
// Note : resetté à chaque cold start — suffisant pour prod sans Redis supplémentaire
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MS = 10 * 60 * 1000 // 10 minutes

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "rate_limited" }

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name             = (formData.get("name")             as string | null)?.trim() ?? ""
  const email            = (formData.get("email")            as string | null)?.trim() ?? ""
  const company          = (formData.get("company")          as string | null)?.trim() ?? ""
  const sector           = (formData.get("sector")           as string | null)?.trim() ?? ""
  const message          = (formData.get("message")          as string | null)?.trim() ?? ""
  const interestedAgent  = (formData.get("interestedAgent")  as string | null)?.trim() ?? ""
  const contextPlan      = (formData.get("contextPlan")      as string | null)?.trim() ?? ""
  const contextSource    = (formData.get("contextSource")    as string | null)?.trim() ?? ""

  // Validation
  if (!name)    return { status: "error", message: "Le nom est requis." }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { status: "error", message: "L'adresse email n'est pas valide." }
  if (!sector)  return { status: "error", message: "Le secteur d'activité est requis." }
  if (!message) return { status: "error", message: "Le message est requis." }

  // Résolution de l'agent demandé (pour routing futur vers l'agent + tagging email)
  const agent = agents.find(a => a.slug === interestedAgent)
  const agentLabel = agent ? `${agent.name} (${agent.role})` : "Aucun agent spécifique"

  // Rate limiting
  const now = Date.now()
  const lastSubmit = rateLimitMap.get(email)
  if (lastSubmit && now - lastSubmit < RATE_LIMIT_MS) {
    return { status: "rate_limited" }
  }
  rateLimitMap.set(email, now)

  // Subject : préfixe avec l'agent demandé pour priorisation/tri visuel dans la boîte
  const subjectAgentTag = agent ? `[${agent.name}] ` : ""
  const subject = `[Contact] ${subjectAgentTag}${sector} — ${name}`

  const html = `<!DOCTYPE html>
<html lang="fr">
<body style="font-family:system-ui,sans-serif;background:#0A0A0B;color:#F5F5F7;padding:40px 32px;max-width:600px;margin:0 auto">
  <h2 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#F5F5F7">
    Nouveau message de contact${agent ? ` — Intérêt ${agent.name}` : ""}
  </h2>
  ${agent ? `<div style="margin:0 0 24px;padding:14px 16px;background:rgba(232,111,77,0.08);border:1px solid rgba(232,111,77,0.2);border-radius:10px">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#E86F4D">Agent demandé</p>
    <p style="margin:0;font-size:15px;font-weight:600;color:#F5F5F7">${agent.name} — ${agent.role}</p>
    <p style="margin:6px 0 0;font-size:12px;color:rgba(245,245,247,0.55)">Slug : <code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px;font-size:11px">${agent.slug}</code> · Statut : ${agent.status}</p>
  </div>` : ""}
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:rgba(245,245,247,0.5);width:140px;vertical-align:top">Nom</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;color:#F5F5F7">${name}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:rgba(245,245,247,0.5);vertical-align:top">Email</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;color:#F5F5F7">
        <a href="mailto:${email}" style="color:#E86F4D;text-decoration:none">${email}</a>
      </td>
    </tr>
    ${company ? `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:rgba(245,245,247,0.5);vertical-align:top">Entreprise</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;color:#F5F5F7">${company}</td>
    </tr>` : ""}
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:rgba(245,245,247,0.5);vertical-align:top">Secteur</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;color:#F5F5F7">${sector}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:rgba(245,245,247,0.5);vertical-align:top">Agent demandé</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;color:#F5F5F7">${agentLabel}</td>
    </tr>
    ${contextPlan ? `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:rgba(245,245,247,0.5);vertical-align:top">Plan d'arrivée</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;color:#F5F5F7">${contextPlan}</td>
    </tr>` : ""}
    ${contextSource ? `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:rgba(245,245,247,0.5);vertical-align:top">Source</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;color:#F5F5F7">${contextSource}</td>
    </tr>` : ""}
    <tr>
      <td style="padding:10px 0;font-size:13px;color:rgba(245,245,247,0.5);vertical-align:top">Message</td>
      <td style="padding:10px 0;font-size:14px;color:#F5F5F7;white-space:pre-wrap;line-height:1.6">${message}</td>
    </tr>
  </table>
</body>
</html>`

  const text = `Nouveau message de contact\n\nNom : ${name}\nEmail : ${email}${company ? `\nEntreprise : ${company}` : ""}\nSecteur : ${sector}\nAgent demandé : ${agentLabel}${contextPlan ? `\nPlan d'arrivée : ${contextPlan}` : ""}${contextSource ? `\nSource : ${contextSource}` : ""}\n\nMessage :\n${message}`

  const result = await sendGmail({
    from:    "Lynaris <support@lynarisai.com>",
    to:      "contact@lynarisai.com",
    replyTo: email,
    subject,
    html,
    text,
  })

  if (!result.success) {
    logger.error("[Contact Form] Gmail error", { err: String(result.error) })
    return {
      status: "error",
      message: "L'envoi a échoué. Réessaie ou écris-nous directement à support@lynarisai.com.",
    }
  }

  // TODO : raccorder Mae (agent mail) pour traiter automatiquement les leads contact via /api/agents/mae/run
  // Quand Mae sera configurée pour ingérer les leads, déclencher ici un POST asynchrone vers son endpoint
  // avec le contexte (agentLabel, sector, message) pour qu'elle prépare une réponse personnalisée draftée

  return { status: "success" }
}
