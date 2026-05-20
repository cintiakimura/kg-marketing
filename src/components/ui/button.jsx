import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00c600]/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
        /** KG primary — green fill, white text */
        kg: "h-11 rounded-xl bg-[#00c600] text-white font-medium px-5 shadow-md shadow-[#00c600]/25 hover:bg-[#00dd00] hover:shadow-[0_0_24px_rgba(0,198,0,0.4)] active:scale-[0.98]",
        /** KG secondary — green outline */
        kgOutline:
          "h-11 rounded-xl border-2 border-[#00c600]/55 bg-transparent text-[#00c600] font-medium px-5 hover:bg-[#00c600]/10 hover:border-[#00c600]",
        /** KG muted — gray outline for tertiary actions */
        kgMuted:
          "h-11 rounded-xl border border-[#444444] bg-[#333333] text-gray-200 font-medium px-5 hover:bg-[#3d3d3d] hover:border-[#555555] hover:text-white",
        /** Accent action (e.g. email follow-ups) */
        kgBlue:
          "h-11 rounded-xl bg-blue-600 text-white font-medium px-5 shadow-md hover:bg-blue-500",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
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
