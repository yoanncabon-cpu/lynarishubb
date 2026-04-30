/**
 * Template HTML email Lynaris — 3 presets visuels + customisation complète.
 *
 * Usage :
 *   renderEmail({ subject, body, style: { preset: "lynaris", accentColor: "#7C3AED", ... } })
 *
 * Override possibles dans `style` :
 *   - Couleurs : accent, background, cardBackground, text, sectionBackground
 *   - Mise en page : headerStyle (gradient/solid/minimal), borderRadius, fontFamily (system/serif/mono)
 *   - Contenu : headerBadgeText, footerText, showFooter
 *
 * Markdown supporté dans body :
 *   ## Titre        → nouvelle section card
 *   # Titre         → titre H1 dans la section
 *   **bold**        → gras
 *   *italic*        → italique
 *   - item / * item → liste à puces
 *   1. item         → liste numérotée
 *   ---             → séparateur
 *   [text](url)     → lien
 *   "Label : valeur" → callout stat
 */

import type { EmailStyleConfig, EmailStylePreset, FontFamily, HeaderStyle } from "@/lib/emails/types"

const FONT_STACKS: Record<FontFamily, string> = {
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
}

interface PresetColors {
  accent: string
  accentLight: string
  pageBg: string
  cardBg: string
  sectionBg: string
  text: string
  textMuted: string
  textSoft: string
  border: string
  borderSoft: string
}

interface PresetConfig {
  colors: PresetColors
  hero: HeaderStyle
  sectionStyle: "card" | "minimal"
  cardRadius: number
  font: string
}

interface ResolvedStyle extends PresetConfig {
  headerBadgeText: string  // "" = ne pas afficher le badge
  footerText: string
  showFooter: boolean
}

const DEFAULT_FOOTER_TEXT = "Envoyé par <strong>Lynaris</strong> · Tes agents IA travaillent en autonomie"

const PRESETS: Record<EmailStylePreset, PresetConfig> = {
  lynaris: {
    colors: {
      accent: "#E86F4D",
      accentLight: "#F39C7A",
      pageBg: "#FDF7F3",
      cardBg: "#FFFFFF",
      sectionBg: "#FBEFE9",
      text: "#1F1F23",
      textMuted: "#6B6B72",
      textSoft: "#8A8A92",
      border: "rgba(232,111,77,0.18)",
      borderSoft: "rgba(0,0,0,0.06)",
    },
    hero: "gradient",
    sectionStyle: "card",
    cardRadius: 20,
    font: FONT_STACKS.system,
  },
  minimal: {
    colors: {
      accent: "#1F1F23",
      accentLight: "#4A4A52",
      pageBg: "#F8F8F8",
      cardBg: "#FFFFFF",
      sectionBg: "#F5F5F5",
      text: "#1F1F23",
      textMuted: "#6B6B72",
      textSoft: "#8A8A92",
      border: "rgba(0,0,0,0.08)",
      borderSoft: "rgba(0,0,0,0.05)",
    },
    hero: "minimal",
    sectionStyle: "minimal",
    cardRadius: 14,
    font: FONT_STACKS.system,
  },
  corporate: {
    colors: {
      accent: "#1E40AF",
      accentLight: "#3B82F6",
      pageBg: "#F1F5F9",
      cardBg: "#FFFFFF",
      sectionBg: "#EFF6FF",
      text: "#0F172A",
      textMuted: "#475569",
      textSoft: "#64748B",
      border: "rgba(30,64,175,0.15)",
      borderSoft: "rgba(0,0,0,0.06)",
    },
    hero: "solid",
    sectionStyle: "card",
    cardRadius: 16,
    font: FONT_STACKS.system,
  },
}

/** Calcule une variante éclaircie d'une couleur HEX. */
function lighten(hex: string, amount = 0.25): string {
  const m = hex.match(/^#?([0-9a-f]{6})$/i)
  if (!m || !m[1]) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount))
  const out = (mix(r) << 16) | (mix(g) << 8) | mix(b)
  return "#" + out.toString(16).padStart(6, "0").toUpperCase()
}

/** Convertit un hex en rgba avec opacité — pour dériver les variantes muted/soft du texte. */
function withOpacity(hex: string, alpha: number): string {
  const m = hex.match(/^#?([0-9a-f]{6})$/i)
  if (!m || !m[1]) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

function resolveStyle(style?: EmailStyleConfig | null): ResolvedStyle {
  const presetName: EmailStylePreset = style?.preset ?? "lynaris"
  const base = PRESETS[presetName] ?? PRESETS.lynaris

  const colors: PresetColors = { ...base.colors }

  if (style?.accentColor) {
    colors.accent = style.accentColor
    colors.accentLight = lighten(style.accentColor, 0.3)
    colors.border = style.accentColor + "2E"
  }
  if (style?.backgroundColor) colors.pageBg = style.backgroundColor
  if (style?.cardBackgroundColor) colors.cardBg = style.cardBackgroundColor
  if (style?.sectionBackgroundColor) colors.sectionBg = style.sectionBackgroundColor
  if (style?.textColor) {
    colors.text = style.textColor
    colors.textMuted = withOpacity(style.textColor, 0.7)
    colors.textSoft = withOpacity(style.textColor, 0.5)
  }

  // Sentinelle : le caller utilise undefined pour "pas d'override". headerBadgeText="" est valide (= masquer)
  return {
    colors,
    hero: style?.headerStyle ?? base.hero,
    sectionStyle: base.sectionStyle,
    cardRadius:
      typeof style?.borderRadius === "number" && style.borderRadius >= 0 && style.borderRadius <= 40
        ? style.borderRadius
        : base.cardRadius,
    font: style?.fontFamily ? FONT_STACKS[style.fontFamily] : base.font,
    headerBadgeText: typeof style?.headerBadgeText === "string" ? style.headerBadgeText : "Lynaris",
    footerText: style?.footerText && style.footerText.trim().length > 0 ? style.footerText : DEFAULT_FOOTER_TEXT,
    showFooter: style?.showFooter !== false, // default true
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function formatInline(text: string, p: ResolvedStyle): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color:${p.colors.accent};text-decoration:none;font-weight:600;border-bottom:1px solid ${p.colors.accent};">$1</a>`)
    .replace(/\*\*([^*]+)\*\*/g, `<strong style="font-weight:600;color:${p.colors.text};">$1</strong>`)
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em style="font-style:italic;">$1</em>')
}

interface Block {
  type: "h1" | "p" | "ul" | "ol" | "hr" | "stat"
  content: string | string[]
  label?: string
  value?: string
}

interface Section {
  title: string | null
  blocks: Block[]
}

function parseMarkdown(body: string): Section[] {
  const lines = body.split(/\r?\n/)
  const sections: Section[] = [{ title: null, blocks: [] }]
  let current = sections[0]!
  let listBuf: { type: "ul" | "ol"; items: string[] } | null = null

  const flushList = () => {
    if (listBuf) {
      current.blocks.push({ type: listBuf.type, content: listBuf.items })
      listBuf = null
    }
  }

  for (const raw of lines) {
    const line = raw.trim()

    const h2 = line.match(/^##\s+(.+)$/)
    if (h2) {
      flushList()
      current = { title: h2[1] ?? "", blocks: [] }
      sections.push(current)
      continue
    }

    if (!line) {
      flushList()
      continue
    }

    if (/^-{3,}$|^_{3,}$|^={3,}$/.test(line)) {
      flushList()
      current.blocks.push({ type: "hr", content: "" })
      continue
    }

    const h1 = line.match(/^#\s+(.+)$/)
    if (h1) {
      flushList()
      current.blocks.push({ type: "h1", content: h1[1] ?? "" })
      continue
    }

    const ulMatch = line.match(/^[-*]\s+(.+)$/)
    if (ulMatch) {
      if (!listBuf || listBuf.type !== "ul") {
        flushList()
        listBuf = { type: "ul", items: [] }
      }
      listBuf.items.push(ulMatch[1] ?? "")
      continue
    }

    const olMatch = line.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      if (!listBuf || listBuf.type !== "ol") {
        flushList()
        listBuf = { type: "ol", items: [] }
      }
      listBuf.items.push(olMatch[1] ?? "")
      continue
    }

    flushList()

    const statMatch = line.match(/^([^:]{2,40})\s*:\s*(.{1,40})$/)
    if (statMatch && line.length < 80 && !line.includes(".") && !/^https?:/i.test(statMatch[2] ?? "")) {
      current.blocks.push({ type: "stat", content: "", label: statMatch[1]?.trim() ?? "", value: statMatch[2]?.trim() ?? "" })
      continue
    }

    current.blocks.push({ type: "p", content: line })
  }
  flushList()

  return sections.filter((s) => s.blocks.length > 0 || s.title)
}

function renderBlock(block: Block, p: ResolvedStyle): string {
  const c = p.colors
  switch (block.type) {
    case "h1":
      return `<h1 style="font-family:${p.font};font-size:19px;font-weight:700;color:${c.text};margin:0 0 14px;line-height:1.3;letter-spacing:-0.01em;">${formatInline(escapeHtml(block.content as string), p)}</h1>`
    case "p":
      return `<p style="font-family:${p.font};font-size:15px;line-height:1.65;color:${c.text};margin:0 0 12px;">${formatInline(escapeHtml(block.content as string), p)}</p>`
    case "ul": {
      const items = (block.content as string[]).map((it) => `
        <tr>
          <td valign="top" style="width:22px;padding:6px 0;">
            <div style="width:7px;height:7px;background:${c.accent};border-radius:50%;margin-top:8px;"></div>
          </td>
          <td valign="top" style="padding:4px 0;font-family:${p.font};font-size:15px;line-height:1.6;color:${c.text};">
            ${formatInline(escapeHtml(it), p)}
          </td>
        </tr>`).join("")
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 14px;"><tbody>${items}</tbody></table>`
    }
    case "ol": {
      const items = (block.content as string[]).map((it, i) => `
        <tr>
          <td valign="top" style="width:28px;padding:6px 0;">
            <div style="font-family:${p.font};font-size:13px;font-weight:700;color:${c.accent};line-height:1;padding-top:5px;">${i + 1}.</div>
          </td>
          <td valign="top" style="padding:4px 0;font-family:${p.font};font-size:15px;line-height:1.6;color:${c.text};">
            ${formatInline(escapeHtml(it), p)}
          </td>
        </tr>`).join("")
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 14px;"><tbody>${items}</tbody></table>`
    }
    case "hr":
      return `<div style="text-align:center;margin:24px 0;color:${c.accent};font-size:14px;letter-spacing:8px;">• • •</div>`
    case "stat":
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 8px;background:${c.sectionBg};border-radius:10px;">
        <tr>
          <td style="padding:11px 14px;font-family:${p.font};font-size:13px;color:${c.textMuted};font-weight:500;">${escapeHtml(block.label ?? "")}</td>
          <td align="right" style="padding:11px 14px;font-family:${p.font};font-size:14px;color:${c.text};font-weight:700;">${escapeHtml(block.value ?? "")}</td>
        </tr>
      </table>`
  }
}

function renderSection(section: Section, isFirst: boolean, p: ResolvedStyle): string {
  const blocksHtml = section.blocks.map((b) => renderBlock(b, p)).join("\n")

  if (section.title === null) {
    return `<div style="padding:${isFirst ? "30px 36px 8px" : "8px 36px"};">${blocksHtml}</div>`
  }

  if (p.sectionStyle === "minimal") {
    return `<div style="padding:18px 36px;">
      <div style="font-family:${p.font};font-size:11px;font-weight:700;color:${p.colors.accent};letter-spacing:0.16em;text-transform:uppercase;margin-bottom:10px;border-bottom:2px solid ${p.colors.accent};padding-bottom:6px;display:inline-block;">${escapeHtml(section.title)}</div>
      ${blocksHtml}
    </div>`
  }

  return `<div style="margin:14px 24px;padding:18px 22px;background:${p.colors.sectionBg};border-left:3px solid ${p.colors.accent};border-radius:0 12px 12px 0;">
    <div style="font-family:${p.font};font-size:11px;font-weight:700;color:${p.colors.accent};letter-spacing:0.14em;text-transform:uppercase;margin-bottom:10px;">${escapeHtml(section.title)}</div>
    ${blocksHtml}
  </div>`
}

function renderHero(subject: string, p: ResolvedStyle): string {
  const c = p.colors
  const badgeText = p.headerBadgeText.trim()

  switch (p.hero) {
    case "gradient": {
      const badge = badgeText
        ? `<div style="display:inline-block;background:rgba(255,255,255,0.18);padding:5px 11px;border-radius:999px;font-family:${p.font};color:#fff;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">${escapeHtml(badgeText)}</div>`
        : ""
      return `<tr><td style="background:linear-gradient(135deg,${c.accent} 0%,${c.accentLight} 100%);padding:36px 40px 34px;">
        ${badge}
        <div style="font-family:${p.font};color:#ffffff;font-size:24px;font-weight:700;line-height:1.25;margin-top:${badgeText ? "14px" : "0"};letter-spacing:-0.01em;">${escapeHtml(subject)}</div>
      </td></tr>`
    }
    case "solid": {
      const badge = badgeText
        ? `<div style="font-family:${p.font};color:rgba(255,255,255,0.85);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">${escapeHtml(badgeText)}</div>`
        : ""
      return `<tr><td style="background:${c.accent};padding:36px 40px 34px;">
        ${badge}
        <div style="font-family:${p.font};color:#ffffff;font-size:24px;font-weight:700;line-height:1.25;margin-top:${badgeText ? "10px" : "0"};letter-spacing:-0.01em;">${escapeHtml(subject)}</div>
      </td></tr>`
    }
    case "minimal": {
      const badge = badgeText
        ? `<div style="font-family:${p.font};color:${c.accent};font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">${escapeHtml(badgeText)}</div>`
        : ""
      return `<tr><td style="background:${c.cardBg};padding:36px 40px 30px;border-bottom:3px solid ${c.accent};">
        ${badge}
        <div style="font-family:${p.font};color:${c.text};font-size:26px;font-weight:700;line-height:1.2;margin-top:${badgeText ? "12px" : "0"};letter-spacing:-0.02em;">${escapeHtml(subject)}</div>
      </td></tr>`
    }
  }
}

/** Détecte un body déjà en HTML complet (qu'on ne doit pas re-wrapper) */
export function isAlreadyHtml(body: string): boolean {
  return /<\s*(html|body|!doctype)\b/i.test(body)
}

export interface RenderEmailArgs {
  subject: string
  body: string
  style?: EmailStyleConfig | null
  ctaLabel?: string
  ctaUrl?: string
}

export function renderEmail(args: RenderEmailArgs): string {
  const { subject, body, style, ctaLabel, ctaUrl } = args
  const p = resolveStyle(style)
  const c = p.colors
  const sections = parseMarkdown(body)
  const sectionsHtml = sections.map((s, i) => renderSection(s, i === 0, p)).join("\n")

  const cta =
    ctaLabel && ctaUrl
      ? `<tr><td align="center" style="padding:6px 36px 28px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${c.accent};color:#fff;font-family:${p.font};font-size:14px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:11px;box-shadow:0 4px 12px ${c.accent}40;">${escapeHtml(ctaLabel)}</a>
        </td></tr>`
      : ""

  // Footer : le contenu est du HTML (laissé tel quel pour permettre des balises stratégiques
  // type <strong>, <a>) — la responsabilité de la sécurité revient à celui qui configure le job.
  // Pas de risque XSS externe car seul le propriétaire du job peut le configurer.
  const footer = p.showFooter
    ? `<tr><td style="padding:22px 36px 28px;border-top:1px solid ${c.borderSoft};background:${c.pageBg};font-family:${p.font};text-align:center;">
        <div style="color:${c.textMuted};font-size:12px;line-height:1.6;">${p.footerText}</div>
        <div style="margin-top:8px;">
          <a href="https://lynarisai.com/dashboard" style="color:${c.textSoft};text-decoration:none;font-size:12px;font-weight:500;border-bottom:1px solid ${c.borderSoft};">Ouvrir le dashboard →</a>
        </div>
      </td></tr>`
    : ""

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${c.pageBg};font-family:${p.font};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.pageBg};">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${c.cardBg};border-radius:${p.cardRadius}px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 16px 40px ${c.accent}1A;">
    ${renderHero(subject, p)}
    <tr><td style="padding:0 0 8px;">${sectionsHtml}</td></tr>
    ${cta}
    ${footer}
  </table>
  ${p.showFooter ? `<div style="font-family:${p.font};color:${c.textSoft};font-size:11px;margin-top:18px;opacity:0.7;">lynarisai.com</div>` : ""}
</td></tr>
</table>
</body>
</html>`
}

// Backward-compat : ancien nom
export const renderBrandedEmail = renderEmail
