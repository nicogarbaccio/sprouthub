import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Info } from "lucide-react";
import { CascadingContainer } from "@/components/ui/cascading-container";

export const NotificationsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Manage what alerts and notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CascadingContainer delay={0}>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Coming Soon</div>
                <p className="text-sm">
                  Notification preferences are currently in development. Soon you'll
                  be able to customize:
                </p>
                <ul className="text-sm space-y-1 ml-4 list-disc mt-2">
                  <li>Watering reminders</li>
                  <li>Seasonal review alerts</li>
                  <li>Smart suggestion notifications</li>
                  <li>Weather alerts</li>
                  <li>Pattern analysis insights</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CascadingContainer>

          <CascadingContainer delay={50}>
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Notification Settings
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This feature will allow you to control which notifications you
                receive and how often you get them. Stay tuned!
              </p>
            </div>
          </CascadingContainer>
        </CardContent>
      </Card>
    </div>
  );
};
