import { cn } from "@/lib/utils"

type StatusBadgeVariant = "success" | "warning" | "danger" | "info" | "default"

const variants: Record<StatusBadgeVariant, string> = {
  success: "bg-[--ly-success]/10 text-[--ly-success] border-[--ly-success]/20",
  warning: "bg-[--ly-warning]/10 text-[--ly-warning] border-[--ly-warning]/20",
  danger: "bg-[--ly-danger]/10 text-[--ly-danger] border-[--ly-danger]/20",
  info: "bg-[--ly-primary]/10 text-[--ly-primary-soft] border-[--ly-primary]/20",
  default: "bg-[--ly-surface] text-[--ly-text-muted] border-[--ly-border]",
}

interface StatusBadgeProps {
  variant?: StatusBadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export function StatusBadge({ variant = "default", children, className, dot = false }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "currentColor" }}
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}
