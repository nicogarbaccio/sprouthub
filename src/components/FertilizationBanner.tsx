import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { FlaskConical, X, Clock, Leaf } from "lucide-react";
import { fertilizationToast } from "@/utils/notifications/toast";

interface FertilizationBannerProps {
  plantCount: number;
  onDismiss: () => void;
  onSnooze: (days: number) => void;
}

export function FertilizationBanner({
  plantCount,
  onDismiss,
  onSnooze,
}: FertilizationBannerProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snoozeWeeks, setSnoozeWeeks] = useState<number | null>(null);

  const handleSnoozeConfirm = () => {
    if (snoozeWeeks === null) return;
    onSnooze(snoozeWeeks * 7);
    fertilizationToast.snoozed(snoozeWeeks);
    setSnoozeWeeks(null);
  };

  return (
    <>
      <AlertDialog
        open={snoozeWeeks !== null}
        onOpenChange={(open) => {
          if (!open) setSnoozeWeeks(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sprout-warning" />
              Snooze for {snoozeWeeks} week{snoozeWeeks !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This reminder will be hidden for {snoozeWeeks} week
                {snoozeWeeks !== 1 ? "s" : ""} and then reappear on the
                dashboard.
              </p>
              <p>
                Your individual plants will still show a{" "}
                <strong className="text-sprout-cream font-bold">Due now</strong>{" "}
                badge on their detail pages — you can log fertilization from
                there at any time.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSnoozeWeeks(null)}>
              Go back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSnoozeConfirm}
              className="bg-sprout-primary hover:bg-sprout-medium text-white border-0"
            >
              Snooze for {snoozeWeeks} week{snoozeWeeks !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-sprout-warning" />
              Dismiss for the season?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This hides the dashboard reminder for the rest of the growing
                season.
              </p>
              <p>
                Your individual plants will still show a{" "}
                <strong className="text-sprout-cream font-bold">Due now</strong>{" "}
                badge on their detail pages — you can log fertilization or skip
                the reminder from there.
              </p>
              <p>
                If you'd rather be reminded later, use{" "}
                <strong className="text-sprout-cream font-bold">
                  Remind me in
                </strong>{" "}
                instead.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDismiss}
              className="bg-sprout-primary hover:bg-sprout-medium text-white border-0"
            >
              Yes, dismiss for the season
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card className="group relative overflow-hidden mb-6 border-2 border-sprout-cream/50 dark:border-sprout-cream/40 hover:border-sprout-cream hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-sprout-cream/25 via-sprout-pale to-sprout-pale dark:from-sprout-cream/[0.08] dark:via-card dark:to-card">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-sprout-cream/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-sprout-cream/10 rounded-full blur-2xl" />

        <CardContent className="p-4 sm:p-6 relative">
          {/* Title row: icon + heading + badge + dismiss */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h3 className="font-bold text-base sm:text-lg text-sprout-dark dark:text-foreground">
                Time to fertilize
              </h3>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs px-2 py-0 flex-shrink-0">
                <Leaf className="w-2.5 h-2.5 mr-1" />
                Growing season
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="opacity-40 hover:opacity-100 flex-shrink-0 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Description + Got it button */}
          <div className="flex items-center gap-4 mb-3">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {plantCount > 0 ? (
                <>
                  <strong className="font-bold text-foreground">
                    {plantCount}
                  </strong>{" "}
                  plant{plantCount !== 1 ? "s haven't" : " hasn't"} been
                  fertilized recently.
                </>
              ) : (
                "Your plants haven't been fertilized recently."
              )}{" "}
              Feeding during the growing season makes the biggest difference.
            </p>
            <Button
              onClick={() => setConfirmOpen(true)}
              size="sm"
              className="bg-sprout-cream hover:bg-sprout-cream/80 text-sprout-dark border-0 font-semibold shadow-sm h-8 px-5 text-sm sm:h-9 sm:px-6 flex-shrink-0"
            >
              Got it
            </Button>
          </div>

          {/* Snooze options */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              Remind me in:
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSnoozeWeeks(1)}
              className="text-xs font-medium hover:bg-sprout-cream/20 text-sprout-primary dark:text-sprout-cream"
            >
              <Clock className="h-3 w-3 mr-1" />1 week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSnoozeWeeks(2)}
              className="text-xs font-medium hover:bg-sprout-cream/20 text-sprout-primary dark:text-sprout-cream"
            >
              2 weeks
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
