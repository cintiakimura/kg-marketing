import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

/** All KG action buttons share one look: transparent green, white text, green border */
const kgButtonSurface =
  "rounded-lg border border-green-500/40 bg-green-500/10 text-white font-normal hover:bg-green-500/15 hover:border-green-500/55 active:bg-green-500/20";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[18px] font-normal transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
        kg: `h-11 px-5 ${kgButtonSurface}`,
        kgOutline: `h-11 px-5 ${kgButtonSurface}`,
        kgMuted: `h-11 px-5 ${kgButtonSurface}`,
        kgBlue: `h-11 px-5 ${kgButtonSurface}`,
        kgAi: `h-11 px-5 ${kgButtonSurface}`,
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-md px-3 text-[18px]",
        lg: "h-12 rounded-lg px-8 text-[18px]",
        icon: "h-11 w-11 rounded-lg p-0",
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
