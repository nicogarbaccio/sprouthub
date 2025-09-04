import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff, Wifi, CloudOff, Cloud } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";

interface OfflineIndicatorProps {
 className?: string;
 showWhenOnline?: boolean;
}

export function OfflineIndicator({
 className,
 showWhenOnline = false,
}: OfflineIndicatorProps) {
 const { isOnline } = usePWA();
 const [showBriefly, setShowBriefly] = React.useState(false);

 // Show briefly when coming back online
 React.useEffect(() => {
 if (isOnline && showWhenOnline) {
  setShowBriefly(true);
  const timeout = setTimeout(() => setShowBriefly(false), 3000);
  return () => clearTimeout(timeout);
 }
 }, [isOnline, showWhenOnline]);

 // Don't show when online unless specified
 if (isOnline && !showBriefly) {
 return null;
 }

 return (
 <Card
  className={`fixed top-20 left-4 right-4 z-40 shadow-lg ${
  isOnline
   ? "bg-sprout-secondary/10 border-sprout-secondary/30"
   : "bg-sprout-warning/10 border-sprout-warning/30"
  } ${className}`}
 >
  <CardContent className="p-3">
  <div className="flex items-center space-x-3">
   <div
   className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
    isOnline ? "bg-sprout-secondary/20" : "bg-sprout-warning/20"
   }`}
   >
   {isOnline ? (
    <Wifi className="w-4 h-4 text-sprout-secondary" />
   ) : (
    <WifiOff className="w-4 h-4 text-sprout-warning" />
   )}
   </div>

   <div className="flex-1 min-w-0">
   <h4
    className={`text-sm font-medium ${
    isOnline ? "text-sprout-primary" : "text-sprout-warning"
    }`}
   >
    {isOnline ? "Back Online" : "Offline Mode"}
   </h4>
   <p
    className={`text-xs ${
    isOnline ? "text-sprout-secondary" : "text-sprout-warning"
    }`}
   >
    {isOnline
    ? "Data will sync automatically"
    : "Your plants are cached locally. Changes will sync when reconnected."}
   </p>
   </div>
  </div>
  </CardContent>
 </Card>
 );
}

// Simple status indicator for header/nav
export function NetworkStatus() {
 const { isOnline } = usePWA();

 return (
 <div className="flex items-center space-x-1">
  <div title={isOnline ? "Online" : "Offline"}>
  {isOnline ? (
   <Cloud className="w-4 h-4 text-sprout-secondary" />
  ) : (
   <CloudOff className="w-4 h-4 text-sprout-warning" />
  )}
  </div>
  <span
  className={`text-xs ${
   isOnline ? "text-sprout-secondary" : "text-sprout-warning"
  }`}
  >
  {isOnline ? "Online" : "Offline"}
  </span>
 </div>
 );
}
