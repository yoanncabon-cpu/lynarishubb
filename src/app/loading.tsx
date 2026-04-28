export default function GlobalLoading() {
  return (
    <div className="min-h-dvh bg-[--ly-bg] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[--ly-primary] to-[--ly-primary-soft] flex items-center justify-center animate-pulse">
          <span className="text-white font-bold select-none">L</span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[--ly-primary]/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  )
}
