// Types partagés entre schema DB (server) et template (client + server).
// Extraits ici pour que le template HTML (et son preview client) ne pull pas Drizzle.

export type EmailStylePreset = "lynaris" | "minimal" | "corporate"

export type HeaderStyle = "gradient" | "solid" | "minimal"
export type FontFamily = "system" | "serif" | "mono"

export interface EmailStyleConfig {
  preset: EmailStylePreset

  // ─── Couleurs ───────────────────────────────────────────
  /** Override la couleur d'accent (header, liens, bullets, callouts) — ex "#E86F4D" */
  accentColor?: string
  /** Override la couleur de fond de la page email — ex "#FDF7F3" */
  backgroundColor?: string
  /** Override la couleur de la card centrale qui contient le contenu — ex "#FFFFFF" */
  cardBackgroundColor?: string
  /** Override la couleur du texte principal (paragraphes, titres) — ex "#1F1F23" */
  textColor?: string
  /** Override la couleur de fond des sections (cards tintées par H2) — ex "#FBEFE9" */
  sectionBackgroundColor?: string

  // ─── Mise en page ────────────────────────────────────────
  /** Style du hero header. gradient = dégradé, solid = couleur unie, minimal = blanc + ligne accent */
  headerStyle?: HeaderStyle
  /** Border-radius de la carte centrale en px (0 = carré, 28 = très arrondi). Default selon preset */
  borderRadius?: number
  /** Famille de police. system = sans-serif système, serif = Georgia, mono = monospace */
  fontFamily?: FontFamily

  // ─── Contenu ─────────────────────────────────────────────
  /** Texte du badge dans le header (default "Lynaris", "" = pas de badge) */
  headerBadgeText?: string
  /** Signature footer custom (default "Envoyé par Lynaris · ...") */
  footerText?: string
  /** Afficher ou non le footer (default true) */
  showFooter?: boolean
}
