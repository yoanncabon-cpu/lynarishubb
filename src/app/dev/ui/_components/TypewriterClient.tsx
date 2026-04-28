"use client"
import { TypewriterText } from "@/components/shared/TypewriterText"

export function TypewriterClient() {
  return (
    <div className="text-2xl font-bold text-[--ly-text]">
      <TypewriterText
        texts={[
          "Marine d\u00e9croche tes appels.",
          "Lou publie ton contenu.",
          "Elio prospecte pour toi.",
          "Charles orchestre tout.",
        ]}
      />
    </div>
  )
}
