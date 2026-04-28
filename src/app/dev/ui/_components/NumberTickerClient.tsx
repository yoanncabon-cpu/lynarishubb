"use client"
import { NumberTicker } from "@/components/shared/NumberTicker"

export function NumberTickerClient() {
  return (
    <div className="flex gap-8">
      <div className="text-center">
        <div className="text-3xl font-bold text-[--ly-text]">
          <NumberTicker value={1234} />
        </div>
        <p className="text-xs text-[--ly-text-muted] mt-1">count-up</p>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-[--ly-text]">
          <NumberTicker value={98} suffix="%" />
        </div>
        <p className="text-xs text-[--ly-text-muted] mt-1">avec suffix</p>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-[--ly-text]">
          <NumberTicker value={4820} suffix="&nbsp;&euro;" />
        </div>
        <p className="text-xs text-[--ly-text-muted] mt-1">MRR</p>
      </div>
    </div>
  )
}
