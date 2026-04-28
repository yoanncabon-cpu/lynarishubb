import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[--ly-primary]/20 text-[--ly-primary-soft] border border-[--ly-primary]/30",
        success: "bg-[--ly-success]/20 text-[--ly-success] border border-[--ly-success]/30",
        warning: "bg-[--ly-warning]/20 text-[--ly-warning] border border-[--ly-warning]/30",
        danger: "bg-[--ly-danger]/20 text-[--ly-danger] border border-[--ly-danger]/30",
        muted: "bg-[--ly-surface] text-[--ly-text-muted] border border-[--ly-border]",
        outline: "border border-[--ly-border] text-[--ly-text-muted]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
