import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
 ({ className, type, onFocus, ...props }, ref) => {
 const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  // Scroll input into view when mobile keyboard opens
  setTimeout(() => {
   e.target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 300);
  onFocus?.(e);
 };

 return (
  <input
  type={type}
  className={cn(
   "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors duration-150",
   className
  )}
  onFocus={handleFocus}
  ref={ref}
  {...props}
  />
 )
 }
)
Input.displayName = "Input"

export { Input }
