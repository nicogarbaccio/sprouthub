import { Check, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";

interface WateredBurstProps {
  /** Smaller drop, ring and badge for compact surfaces like a list row */
  compact?: boolean;
  className?: string;
}

/**
 * The Watered! confirmation, laid over a plant's photo or tile. Fills its nearest positioned
 * ancestor and ignores pointer events; mount it while useJustWatered is true and it plays once.
 */
export function WateredBurst({ compact = false, className }: WateredBurstProps) {
  return (
    <div
      className={cn(
        "watered-overlay pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[inherit] bg-sprout-water/35 backdrop-blur-[3px]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          "watered-ring absolute rounded-full border-2 border-sprout-pale",
          compact ? "h-10 w-10" : "h-16 w-16"
        )}
      />
      <Droplet
        className={cn(
          "watered-drop absolute fill-sprout-pale text-sprout-water",
          compact ? "h-7 w-7" : "h-10 w-10"
        )}
        strokeWidth={1.5}
      />
      <span
        className={cn(
          "watered-badge relative flex items-center gap-1.5 rounded-full bg-sprout-dark font-bold text-sprout-cream shadow-lg",
          compact ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-[15px]"
        )}
      >
        <Check className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={3} />
        Watered!
      </span>
    </div>
  );
}
