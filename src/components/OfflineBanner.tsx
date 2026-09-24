import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

/**
 * Shows a subtle banner at the top of the screen when the device is offline.
 * Slides in/out smoothly (grid-rows 0fr <-> 1fr animates height without measuring it).
 */
export const OfflineBanner = () => {
  const isOnline = useNetworkStatus();

  return (
    <div
      aria-hidden={isOnline}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 z-50 relative",
        isOnline ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      )}
    >
      <div className="overflow-hidden bg-sprout-warning text-white text-center text-sm font-medium">
        <div className="flex items-center justify-center gap-2 py-2 px-4">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You're offline — changes will sync when reconnected</span>
        </div>
      </div>
    </div>
  );
};
