import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, Droplets, TrendingUp, CheckCircle, RotateCcw } from "lucide-react";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { useNotificationPreferences } from "@/contexts/NotificationPreferencesContext";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const NotificationsTab = () => {
  const { preferences, updatePreferences, resetToDefaults } = useNotificationPreferences();

  const handleReset = () => {
    resetToDefaults();
    toast.success("Notification preferences reset to defaults");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>
                Control what alerts and notifications you receive
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2 w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <CascadingContainer delay={0}>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/5">
              <div className="space-y-0.5">
                <Label htmlFor="enabled" className="text-base font-medium">
                  Enable Notifications
                </Label>
                <div className="text-sm text-muted-foreground">
                  Master switch for all in-app notifications
                </div>
              </div>
              <Switch
                id="enabled"
                checked={preferences.enabled}
                onCheckedChange={(checked) =>
                  updatePreferences({ enabled: checked })
                }
              />
            </div>
          </CascadingContainer>

          <Separator />

          {/* Plant Care Alerts */}
          <CascadingContainer delay={50}>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2 mb-1">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  Plant Care Alerts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get notified about your plants watering needs
                </p>
              </div>

              <div className="space-y-4 sm:ml-7">
                {/* Overdue Watering */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1">
                    <Label
                      htmlFor="overdueWatering"
                      className="text-sm font-medium"
                    >
                      Overdue Watering
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      Alert when plants are overdue for watering
                    </div>
                  </div>
                  <Switch
                    id="overdueWatering"
                    checked={preferences.overdueWatering}
                    disabled={!preferences.enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences({ overdueWatering: checked })
                    }
                  />
                </div>

                {/* Due Today */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1">
                    <Label
                      htmlFor="dueTodayWatering"
                      className="text-sm font-medium"
                    >
                      Due Today
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      Alert when plants need watering today
                    </div>
                  </div>
                  <Switch
                    id="dueTodayWatering"
                    checked={preferences.dueTodayWatering}
                    disabled={!preferences.enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences({ dueTodayWatering: checked })
                    }
                  />
                </div>

                {/* Overwatering Risk */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1">
                    <Label
                      htmlFor="overwateringRisk"
                      className="text-sm font-medium"
                    >
                      Overwatering Risk
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      Alert when plants might be getting too much water
                    </div>
                  </div>
                  <Switch
                    id="overwateringRisk"
                    checked={preferences.overwateringRisk}
                    disabled={!preferences.enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences({ overwateringRisk: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </CascadingContainer>

          <Separator />

          {/* Success Notifications */}
          <CascadingContainer delay={100}>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2 mb-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Success Notifications
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get confirmation when you complete actions
                </p>
              </div>

              <div className="space-y-4 sm:ml-7">
                {/* Watering Success */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1">
                    <Label
                      htmlFor="wateringSuccess"
                      className="text-sm font-medium"
                    >
                      Watering Success
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      Confirm when you water individual plants
                    </div>
                  </div>
                  <Switch
                    id="wateringSuccess"
                    checked={preferences.wateringSuccess}
                    disabled={!preferences.enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences({ wateringSuccess: checked })
                    }
                  />
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="bulkActions" className="text-sm font-medium">
                      Bulk Actions
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      Confirm when you perform bulk operations
                    </div>
                  </div>
                  <Switch
                    id="bulkActions"
                    checked={preferences.bulkActions}
                    disabled={!preferences.enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences({ bulkActions: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </CascadingContainer>

          <Separator />

          {/* Pattern Insights */}
          <CascadingContainer delay={150}>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Pattern Insights
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get smart suggestions based on your watering patterns
                </p>
              </div>

              <div className="space-y-4 sm:ml-7">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1">
                    <Label
                      htmlFor="patternInsights"
                      className="text-sm font-medium"
                    >
                      Pattern Analysis
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      Get insights about your plant care patterns
                    </div>
                  </div>
                  <Switch
                    id="patternInsights"
                    checked={preferences.patternInsights}
                    disabled={!preferences.enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences({ patternInsights: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </CascadingContainer>

          <Separator />

          {/* Check Frequency */}
          <CascadingContainer delay={200}>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2 mb-1">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Check Frequency
                </h3>
                <p className="text-sm text-muted-foreground">
                  How often to check for new notifications
                </p>
              </div>

              <div className="sm:ml-7">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:max-w-md">
                  <Label htmlFor="checkFrequency" className="text-sm font-medium">
                    Update Frequency
                  </Label>
                  <Select
                    value={preferences.checkFrequency}
                    onValueChange={(value: 'realtime' | 'hourly' | 'daily') =>
                      updatePreferences({ checkFrequency: value })
                    }
                    disabled={!preferences.enabled}
                  >
                    <SelectTrigger id="checkFrequency" className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {preferences.checkFrequency === 'realtime' && 'Notifications generated immediately when conditions change'}
                  {preferences.checkFrequency === 'hourly' && 'Check for new notifications once per hour'}
                  {preferences.checkFrequency === 'daily' && 'Check for new notifications once per day'}
                </p>
              </div>
            </div>
          </CascadingContainer>
        </CardContent>
      </Card>
    </div>
  );
};
