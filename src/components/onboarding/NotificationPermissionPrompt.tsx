import { useState } from "react";
import { Bell, Clock, Droplets, Loader2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetPrimaryButtonClasses,
  sheetSecondaryButtonClasses,
  sheetTitleClasses,
} from "@/components/ui/bento-sheet";
import { pushNotificationService } from "@/services/pushNotificationService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BENEFITS = [
  { icon: Clock, text: "Daily reminders at your preferred time" },
  { icon: Droplets, text: "Only when plants actually need water" },
  { icon: Smartphone, text: "Works even when the app is closed" },
];

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
      <DialogContent className={cn(dialogSheetClasses, "sm:max-w-md")}>
        <SheetGrabber />
        <DialogHeader className="mt-[18px] sm:mt-0 px-1.5 text-left space-y-0 pr-0">
          <div className="w-16 h-16 mb-4 rounded-full bg-sprout-cream text-sprout-dark flex items-center justify-center">
            <Bell className="w-8 h-8" />
          </div>
          <DialogTitle className={sheetTitleClasses}>
            Never miss a watering day
          </DialogTitle>
          <DialogDescription className="text-[15px] font-medium mt-1">
            Get a reminder when your plants need water. You can change the time in Settings.
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-4 rounded-3xl bg-card p-2 space-y-1">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 rounded-[18px] px-2.5 py-2">
              <span className="w-10 h-10 shrink-0 rounded-[14px] bg-field text-foreground flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-[15px] font-semibold text-foreground">{text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={handleEnableNotifications}
            disabled={isRequesting}
            className={sheetPrimaryButtonClasses}
          >
            {isRequesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
            Enable notifications
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isRequesting}
            className={sheetSecondaryButtonClasses}
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
