import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { pushNotificationService } from "@/services/pushNotificationService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NotificationPermissionPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export const NotificationPermissionPrompt = ({
  open,
  onOpenChange,
  onComplete,
}: NotificationPermissionPromptProps) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      await pushNotificationService.initialize();
      const status = await pushNotificationService.getPermissionStatus();

      if (status === "granted") {
        toast.success("Notifications enabled!", {
          description: "You'll receive watering reminders for your plants",
        });
        onComplete();
      } else if (status === "denied") {
        toast.error("Notifications blocked", {
          description:
            "Please enable notifications in your browser settings to receive reminders",
        });
        onComplete();
      } else {
        // User dismissed the prompt
        onComplete();
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Something went wrong", {
        description: "Please try again from Settings",
      });
      onComplete();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    toast.info("You can enable notifications later in Settings");
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-plant-primary/10 rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-plant-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Never Miss a Watering Day
          </DialogTitle>
          <DialogDescription className="text-center">
            Get timely reminders when your plants need water. You can customize
            notification times in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 bg-plant-primary rounded-full mt-1.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              Daily reminders at your preferred time
            </p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 bg-plant-primary rounded-full mt-1.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              Only when plants actually need watering
            </p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 bg-plant-primary rounded-full mt-1.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              Works even when the app is closed
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleEnableNotifications}
            disabled={isRequesting}
            className="w-full"
            size="lg"
          >
            Enable Notifications
          </Button>
          <Button
            onClick={handleSkip}
            variant="ghost"
            disabled={isRequesting}
            className="w-full"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
