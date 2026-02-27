import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Shows a subtle banner at the top of the screen when the device is offline.
 * Slides in/out smoothly.
 */
export const OfflineBanner = () => {
  const isOnline = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-sprout-warning text-white text-center text-sm font-medium overflow-hidden z-50 relative"
        >
          <div className="flex items-center justify-center gap-2 py-2 px-4">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>You're offline — changes will sync when reconnected</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
