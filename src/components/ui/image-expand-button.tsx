import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageExpandButtonProps {
  onExpand: () => void;
  className?: string;
}

export function ImageExpandButton({ onExpand, className }: ImageExpandButtonProps) {
  return (
    <button
      className={cn(
        "absolute bottom-2 right-2 bg-black/50 hover:bg-black/60 text-white rounded-md p-1.5",
        "opacity-60 sm:opacity-0 sm:group-hover:opacity-100",
        "transition-opacity duration-200",
        "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-0",
        "min-w-6 min-h-6 flex items-center justify-center",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onExpand();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onExpand();
        }
      }}
      aria-label="View fullscreen image"
      tabIndex={0}
    >
      <Maximize2 className="w-3.5 h-3.5" />
    </button>
  );
}
