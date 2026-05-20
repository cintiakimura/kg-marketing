import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-normal transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kg-green/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 rounded-xl h-11",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 rounded-xl h-11",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-xl h-11",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 rounded-xl h-11",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl h-11",
        link: "text-primary underline-offset-4 hover:underline",
        /** KG Lite primary — luminous green, white text */
        kg: "h-11 rounded-xl bg-kg-green text-white font-normal px-5 shadow-lg shadow-kg-green/35 hover:bg-kg-green-hover hover:shadow-kg-glow active:scale-[0.98]",
        kgOutline:
          "h-11 rounded-xl border-2 border-kg-green/50 bg-transparent text-kg-green font-normal px-5 hover:bg-kg-green-muted hover:border-kg-green hover:text-kg-green-hover",
        kgMuted:
          "h-11 rounded-xl border border-kg-green/20 bg-kg-raised text-gray-300 font-normal px-5 hover:bg-kg-surface hover:border-kg-green/35 hover:text-white",
        kgBlue:
          "h-11 rounded-xl bg-blue-600 text-white font-normal px-5 shadow-md hover:bg-blue-500",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-[13px]",
        icon: "h-11 w-11 rounded-xl",
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
