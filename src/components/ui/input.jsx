import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-kg-green/20 bg-kg-raised px-4 py-2 text-[13px] font-normal leading-relaxed text-white shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-normal file:text-foreground placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kg-green/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
