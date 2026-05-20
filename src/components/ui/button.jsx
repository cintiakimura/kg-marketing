import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-normal transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 rounded-lg h-11",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 rounded-lg h-11",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-lg h-11",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 rounded-lg h-11",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-lg h-11",
        link: "text-primary underline-offset-4 hover:underline",
        /** KG Lite primary — dark rich green, white text, inner highlight + glow */
        kg: "h-11 rounded-lg bg-kg-btn text-white font-normal px-5 shadow-kg-btn hover:bg-kg-btn-hover hover:shadow-kg-btn-hover active:scale-[0.98]",
        kgOutline:
          "h-11 rounded-lg border border-green-500/40 bg-transparent text-green-400 font-normal px-5 hover:bg-kg-muted hover:border-green-500/55",
        kgMuted:
          "h-11 rounded-lg border border-green-500/25 bg-kg-raised text-gray-300 font-normal px-5 hover:bg-kg-card hover:border-green-500/40 hover:text-white",
        kgBlue:
          "h-11 rounded-lg bg-blue-700 text-white font-normal px-5 shadow-md hover:bg-blue-600",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-[13px]",
        icon: "h-11 w-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
