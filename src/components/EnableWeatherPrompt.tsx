import { CloudRain, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EnableWeatherPrompt() {
  return (
    <Card className="border-blue-400/30 bg-gradient-to-br from-blue-400/10 to-purple-400/10 mb-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="relative">
              <CloudRain className="w-12 h-12 text-blue-400" />
              <Sparkles className="w-5 h-5 text-purple-400 absolute -top-1 -right-1" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Get Weather-Smart Plant Care
              </h3>
              <p className="text-sm text-muted-foreground">
                Enable weather features to get real-time insights about how the weather affects your plants:
              </p>
            </div>

            {/* Feature List */}
            <ul className="text-sm text-muted-foreground space-y-1.5 ml-5">
              <li className="list-disc">
                <span className="font-medium text-foreground">Weather Mood Banner</span> - Fun, animated messages based on today's conditions
              </li>
              <li className="list-disc">
                <span className="font-medium text-foreground">Rain Delay Alerts</span> - Skip watering outdoor plants when rain is expected
              </li>
              <li className="list-disc">
                <span className="font-medium text-foreground">Seasonal Adjustments</span> - Get smart schedule suggestions as seasons change
              </li>
              <li className="list-disc">
                <span className="font-medium text-foreground">Weather Insights</span> - Real-time temperature, humidity, and forecast data
              </li>
            </ul>

            {/* Help Text */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground italic">
                💡 Enable weather features from your profile menu (click your avatar in the top-right corner)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
