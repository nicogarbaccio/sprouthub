import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePWA } from "@/hooks/use-pwa";
import { usePWABanner } from "@/components/pwa/PWAInstallBanner";
import { RefreshCw, Trash2, Info } from "lucide-react";

interface PWADebugPanelProps {
 className?: string;
}

export function PWADebugPanel({ className }: PWADebugPanelProps) {
 const { canInstall, isStandalone, isOnline } = usePWA();
 const { resetBannerState, getBannerState } = usePWABanner();
 const [bannerState, setBannerState] = React.useState(getBannerState());

 const refreshState = () => {
  setBannerState(getBannerState());
 };

 const handleResetBanner = () => {
  resetBannerState();
  refreshState();
 };

 React.useEffect(() => {
  refreshState();
 }, []);

 return (
  <Card
   className={`${className} border-dashed border-2 border-orange-200 bg-orange-50/50`}
  >
   <CardHeader className="pb-3">
    <CardTitle className="flex items-center space-x-2 text-orange-800">
     <Info className="w-4 h-4" />
     <span className="text-sm">PWA Debug Panel</span>
    </CardTitle>
   </CardHeader>
   <CardContent className="space-y-3">
    {/* PWA Status */}
    <div className="space-y-2">
     <h4 className="text-xs font-semibold text-orange-800">PWA Status</h4>
     <div className="flex flex-wrap gap-1">
      <Badge
       variant={canInstall ? "default" : "secondary"}
       className="text-xs"
      >
       {canInstall ? "✅ Installable" : "❌ Not Installable"}
      </Badge>
      <Badge
       variant={isStandalone ? "default" : "secondary"}
       className="text-xs"
      >
       {isStandalone ? "📱 Standalone" : "🌐 Browser"}
      </Badge>
      <Badge
       variant={isOnline ? "default" : "destructive"}
       className="text-xs"
      >
       {isOnline ? "🌐 Online" : "📴 Offline"}
      </Badge>
     </div>
    </div>

    {/* Banner State */}
    <div className="space-y-2">
     <h4 className="text-xs font-semibold text-orange-800">
      Banner State
     </h4>
     <div className="text-xs text-orange-700 space-y-1">
      <div>
       Dismiss Count: <strong>{bannerState.dismissCount}</strong>
      </div>
      <div>
       Last Dismissed:{" "}
       <strong>
        {bannerState.lastDismissed
         ? new Date(
           parseInt(bannerState.lastDismissed)
          ).toLocaleString()
         : "Never"}
       </strong>
      </div>
      <div>
       Permanently Dismissed:{" "}
       <Badge
        variant={
         bannerState.permanentlyDismissed ? "destructive" : "default"
        }
        className="text-xs"
       >
        {bannerState.permanentlyDismissed ? "Yes" : "No"}
       </Badge>
      </div>
     </div>
    </div>

    {/* Actions */}
    <div className="space-y-2">
     <h4 className="text-xs font-semibold text-orange-800">Actions</h4>
     <div className="flex space-x-2">
      <Button
       onClick={refreshState}
       size="sm"
       variant="outline"
       className="text-xs h-7 px-2 border-orange-300 text-orange-700 hover:bg-orange-100"
      >
       <RefreshCw className="w-3 h-3 mr-1" />
       Refresh
      </Button>
      <Button
       onClick={handleResetBanner}
       size="sm"
       variant="outline"
       className="text-xs h-7 px-2 border-orange-300 text-orange-700 hover:bg-orange-100"
      >
       <Trash2 className="w-3 h-3 mr-1" />
       Reset Banner
      </Button>
     </div>
    </div>

    {/* Instructions */}
    <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
     <strong>Note:</strong> This panel only appears in development. Reset
     banner to test install prompts again.
    </div>
   </CardContent>
  </Card>
 );
}

// Hook to conditionally show debug panel
export function usePWADebug() {
 const isDevelopment = import.meta.env.DEV;

 return {
  isDevelopment,
  showDebugPanel:
   isDevelopment &&
   (localStorage.getItem("pwa-debug") === "true" ||
    window.location.search.includes("debug=pwa")),
 };
}
