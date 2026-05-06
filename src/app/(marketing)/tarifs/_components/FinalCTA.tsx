import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-4 py-24">
      {/* Background décoratif */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 800px 400px at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 600px 300px at 50% 100%, rgba(34,211,238,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2
          className="text-4xl md:text-5xl font-bold text-[#F5F5F7] tracking-tight mb-4"
          style={{ letterSpacing: "-0.03em" }}
        >
          Encore une question ?
        </h2>
        <p className="text-lg text-[#A1A1AA] max-w-xl mx-auto mb-10 leading-relaxed">
          Démarre gratuitement, sans CB. Ou réserve une démo pour qu&apos;on te
          montre Lynaris en action sur ton secteur.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 h-12 rounded-xl px-8 text-sm font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2"
            style={{
              background: "linear-gradient(90deg, #7C3AED, #22D3EE)",
              color: "#FFFFFF",
              boxShadow: "0 8px 24px -6px rgba(124,58,237,0.5)",
            }}
          >
            Commencer gratuitement
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 h-12 rounded-xl px-8 text-sm font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#F5F5F7",
            }}
          >
            <Calendar className="size-4" aria-hidden />
            Réserver une démo
          </Link>
        </div>
      </div>
    </section>
  )
}
