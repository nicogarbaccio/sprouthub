import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  confirmCancelClasses,
  confirmDialogClasses,
  confirmIconClasses,
  confirmTitleClasses,
} from "@/components/settings/SettingsUI";

interface PostponeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  plantName: string;
  currentNextWatering: string;
  postponedNextWatering: string;
}

export function PostponeConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  plantName,
  currentNextWatering,
  postponedNextWatering,
}: PostponeConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="postpone-confirmation-dialog" className={confirmDialogClasses}>
        <AlertDialogHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <div className={cn(confirmIconClasses, "bg-sprout-cream text-sprout-dark")}>
              <Clock className="w-6 h-6" />
            </div>
            <AlertDialogTitle data-testid="postpone-confirmation-title" className={confirmTitleClasses}>
              Postpone watering for {plantName}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription data-testid="postpone-confirmation-description" asChild>
            <div className="space-y-3 text-[15px]">
              <div data-testid="postpone-date-info" className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div data-testid="current-next-watering" className="rounded-[18px] bg-card p-3">
                  <div className="text-xs font-bold uppercase tracking-[0.8px] text-muted-foreground">Now due</div>
                  <div className="font-display text-base font-bold text-foreground mt-0.5">{currentNextWatering}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" aria-label="moves to" />
                <div data-testid="new-next-watering" className="rounded-[18px] bg-sprout-cream text-sprout-dark p-3">
                  <div className="text-xs font-bold uppercase tracking-[0.8px]">New date</div>
                  <div className="font-display text-base font-bold mt-0.5">{postponedNextWatering}</div>
                </div>
              </div>
              <p>This delays watering by 1 day. You can still water {plantName} yourself if needed.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="postpone-cancel-button" className={confirmCancelClasses}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="postpone-confirm-button"
            onClick={handleConfirm}
            className="h-12 rounded-[18px] bg-sprout-cream text-sprout-dark hover:bg-sprout-cream/90 font-bold gap-2"
          >
            <Clock className="w-4 h-4" />
            Push to Tomorrow
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default PostponeConfirmationDialog;
