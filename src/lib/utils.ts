import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge the bento radius names from tailwind.config, so e.g. cn("rounded-md",
// "rounded-card") keeps only rounded-card. Otherwise both stay and whichever comes later in
// the stylesheet wins, which for rounded-card is rounded-md.
const twMerge = extendTailwindMerge({
 extend: { theme: { borderRadius: ["tile", "card", "well"] } },
})

export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs))
}

/** Uppercases the first letter, e.g. "medium" → "Medium" */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
