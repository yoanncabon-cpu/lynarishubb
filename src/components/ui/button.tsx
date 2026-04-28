import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ly-primary] focus-visible:ring-offset-2 focus-visible:ring-offset-[--ly-bg] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[--ly-primary] text-white shadow-[0_0_20px_rgba(232,111,77,0.3)] hover:bg-[--ly-primary-hover] hover:shadow-[0_0_30px_rgba(232,111,77,0.5)] active:scale-[0.98]",
        secondary:
          "bg-[--ly-surface] text-[--ly-text] border border-[--ly-border] hover:border-[--ly-border-hover] hover:bg-[--ly-elevated] active:scale-[0.98]",
        ghost:
          "text-[--ly-text-muted] hover:text-[--ly-text] hover:bg-[--ly-surface] active:scale-[0.98]",
        danger:
          "bg-[--ly-danger] text-white hover:bg-red-400 active:scale-[0.98]",
        outline:
          "border border-[--ly-primary] text-[--ly-primary] hover:bg-[--ly-primary] hover:text-white active:scale-[0.98]",
        link:
          "text-[--ly-primary] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-9 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
