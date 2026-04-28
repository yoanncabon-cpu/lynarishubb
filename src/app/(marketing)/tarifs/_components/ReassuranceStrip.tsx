import { Sparkles, ShieldCheck, CreditCard, Clock } from "lucide-react"

const ITEMS = [
  { icon: Sparkles, label: "14 jours d'essai gratuit", color: "#10B981" },
  { icon: CreditCard, label: "Sans CB ni engagement", color: "#22D3EE" },
  { icon: ShieldCheck, label: "RGPD · Données en France", color: "#A78BFA" },
  { icon: Clock, label: "Setup en 48h", color: "#F59E0B" },
] as const

export function ReassuranceStrip() {
  return (
    <section className="px-4 pb-16">
      <div className="mx-auto max-w-7xl">
        <div
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm py-5 px-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {ITEMS.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-3 justify-center">
              <Icon className="size-4 shrink-0" style={{ color }} aria-hidden />
              <span className="text-sm text-[#D4D4D8] font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
