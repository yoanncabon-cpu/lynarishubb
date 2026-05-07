import type { LucideIcon } from "lucide-react"
import {
  Home,
  Briefcase,
  TrendingUp,
  Layers,
  UserCircle,
  ShieldCheck,
  Library,
  FileText,
  LayoutGrid,
  Clock,
  CheckSquare,
  MessageSquare,
  ContactRound,
  Users,
  BarChart3,
  Bot,
  Sparkles,
  Plug,
  Briefcase as TeamIcon,
  CreditCard,
  Settings,
  LifeBuoy,
  CalendarDays,
} from "lucide-react"

export interface SubItem {
  href: string
  label: string
  icon: LucideIcon
  proOnly?: boolean
}

export interface NavHub {
  id: string
  label: string
  icon: LucideIcon
  href: string
  exact?: boolean
  items: SubItem[]
  adminOnly?: boolean
}

export const NAV_HUBS: NavHub[] = [
  {
    id: "accueil",
    label: "Accueil",
    icon: Home,
    href: "/dashboard",
    exact: true,
    items: [],
  },
  {
    id: "travail",
    label: "Travail",
    icon: Briefcase,
    href: "/dashboard/contenus",
    items: [
      { href: "/dashboard/taches", label: "Tâches", icon: CheckSquare },
      { href: "/dashboard/contenus", label: "Contenus", icon: Library, proOnly: true },
      { href: "/dashboard/documents", label: "Documents", icon: FileText },
      { href: "/dashboard/workspace", label: "Espace de travail", icon: LayoutGrid },
      { href: "/dashboard/automatisations", label: "Automatisations", icon: Clock },
      { href: "/dashboard/calendrier", label: "Calendrier", icon: CalendarDays },
      { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
    ],
  },
  {
    id: "croissance",
    label: "Croissance",
    icon: TrendingUp,
    href: "/dashboard/analytics",
    items: [
      { href: "/dashboard/crm", label: "CRM", icon: ContactRound, proOnly: true },
      { href: "/dashboard/contacts", label: "Contacts", icon: Users },
      { href: "/dashboard/analytics", label: "Statistiques", icon: BarChart3, proOnly: true },
    ],
  },
  {
    id: "plateforme",
    label: "Plateforme",
    icon: Layers,
    href: "/dashboard/agents",
    items: [
      { href: "/dashboard/agents", label: "Mes agents", icon: Bot },
      { href: "/dashboard/skills", label: "Compétences", icon: Sparkles },
      { href: "/dashboard/integrations", label: "Intégrations", icon: Plug },
      { href: "/dashboard/team", label: "Équipe", icon: TeamIcon },
    ],
  },
  {
    id: "compte",
    label: "Compte",
    icon: UserCircle,
    href: "/dashboard/billing",
    items: [
      { href: "/dashboard/billing", label: "Facturation", icon: CreditCard },
      { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
      { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    href: "/dashboard/admin/tickets",
    adminOnly: true,
    items: [
      { href: "/dashboard/admin/tickets", label: "Tickets", icon: ShieldCheck },
      { href: "/dashboard/admin/provision", label: "Provision", icon: ShieldCheck },
    ],
  },
]

/**
 * Détermine le hub actif depuis le pathname.
 * Retourne `null` pour les routes non rattachées (auth, marketing).
 */
export function findActiveHub(pathname: string): NavHub | null {
  // Accueil = match exact
  if (pathname === "/dashboard") return NAV_HUBS[0] ?? null

  // Pour les autres : longest prefix match parmi les items
  let best: { hub: NavHub; len: number } | null = null
  for (const hub of NAV_HUBS) {
    if (hub.id === "accueil") continue
    for (const item of hub.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        if (!best || item.href.length > best.len) {
          best = { hub, len: item.href.length }
        }
      }
    }
  }
  return best?.hub ?? null
}
