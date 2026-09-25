import { useState } from "react";
import { Link } from "react-router-dom";
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
import { FlaskConical, Clock, Leaf, ChevronDown, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HomeBanner } from "@/components/dashboard/HomeBanner";
import {
  confirmCancelClasses,
  confirmDialogClasses,
  confirmIconClasses,
  confirmPrimaryClasses,
  confirmTitleClasses,
} from "@/components/settings/SettingsUI";
import { fertilizationToast } from "@/utils/notifications/toast";
import { getDaysSince } from "@/utils/watering/schedule";
import type { UserPlant } from "@/hooks/useUserPlants";

interface FertilizationBannerProps {
  plantCount: number;
  plants: UserPlant[];
  onLogFertilization: (plantId: string) => Promise<boolean>;
  onDismiss: () => void;
  onSnooze: (days: number) => void;
}

function daysSinceLabel(plant: UserPlant): string {
  const days = getDaysSince(plant.last_fertilized_at);
  if (days === null) return "never";
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export function FertilizationBanner({
  plantCount,
  plants,
  onLogFertilization,
  onDismiss,
  onSnooze,
}: FertilizationBannerProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snoozeWeeks, setSnoozeWeeks] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());
  const [loggingId, setLoggingId] = useState<string | null>(null);

  const handleSnoozeConfirm = () => {
    if (snoozeWeeks === null) return;
    onSnooze(snoozeWeeks * 7);
    fertilizationToast.snoozed(snoozeWeeks);
    setSnoozeWeeks(null);
  };

  const [confirmLogPlantId, setConfirmLogPlantId] = useState<string | null>(null);
  const confirmLogPlant = confirmLogPlantId
    ? plants.find((p) => p.id === confirmLogPlantId)
    : null;

  const handleLogConfirm = async () => {
    if (!confirmLogPlantId) return;
    const plantId = confirmLogPlantId;
    setConfirmLogPlantId(null);
    setLoggingId(plantId);
    try {
      const success = await onLogFertilization(plantId);
      if (success) {
        setLoggedIds((prev) => new Set(prev).add(plantId));
      }
    } finally {
      setLoggingId(null);
    }
  };

  const visiblePlants = plants.filter((p) => !loggedIds.has(p.id));

  return (
    <>
      <AlertDialog
        open={confirmLogPlantId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmLogPlantId(null);
        }}
      >
        <AlertDialogContent className={confirmDialogClasses}>
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-1">
              <div className={cn(confirmIconClasses, "bg-sprout-success text-sprout-dark")}>
                <FlaskConical className="w-6 h-6" />
              </div>
              <AlertDialogTitle className={confirmTitleClasses}>Log fertilization?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[15px]">
              This will record today's date as the last fertilization for{" "}
              <strong className="text-foreground font-bold">
                {confirmLogPlant?.nickname || confirmLogPlant?.plant_type || "this plant"}
              </strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={confirmCancelClasses}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogConfirm}
              className={confirmPrimaryClasses}
            >
              Yes, log it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={snoozeWeeks !== null}
        onOpenChange={(open) => {
          if (!open) setSnoozeWeeks(null);
        }}
      >
        <AlertDialogContent className={confirmDialogClasses}>
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-1">
              <div className={cn(confirmIconClasses, "bg-sprout-cream text-sprout-dark")}>
                <Clock className="w-6 h-6" />
              </div>
              <AlertDialogTitle className={confirmTitleClasses}>Snooze for {snoozeWeeks} week{snoozeWeeks !== 1 ? "s" : ""}?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-[15px]">
              <p>
                This reminder will be hidden for {snoozeWeeks} week
                {snoozeWeeks !== 1 ? "s" : ""} and then reappear on the
                dashboard.
              </p>
              <p>
                Your individual plants will still show a{" "}
                <strong className="text-foreground font-bold">Due now</strong>{" "}
                badge on their detail pages — you can log fertilization from
                there at any time.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSnoozeWeeks(null)} className={confirmCancelClasses}>
              Go back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSnoozeConfirm}
              className={confirmPrimaryClasses}
            >
              Snooze for {snoozeWeeks} week{snoozeWeeks !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className={confirmDialogClasses}>
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-1">
              <div className={cn(confirmIconClasses, "bg-field text-foreground")}>
                <FlaskConical className="w-6 h-6" />
              </div>
              <AlertDialogTitle className={confirmTitleClasses}>Dismiss for the season?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-[15px]">
              <p>
                This hides the dashboard reminder for the rest of the growing
                season.
              </p>
              <p>
                Your individual plants will still show a{" "}
                <strong className="text-foreground font-bold">Due now</strong>{" "}
                badge on their detail pages — you can log fertilization or skip
                the reminder from there.
              </p>
              <p>
                If you'd rather be reminded later, use{" "}
                <strong className="text-foreground font-bold">
                  Remind me in
                </strong>{" "}
                instead.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={confirmCancelClasses}>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDismiss}
              className={confirmPrimaryClasses}
            >
              Yes, dismiss for the season
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <HomeBanner
        testId="fertilization-banner"
        tileClasses="bg-sprout-cream"
        icon={FlaskConical}
        chip={<><Leaf className="w-3 h-3" />Growing season</>}
        title="Time to fertilize"
        onDismiss={() => setConfirmOpen(true)}
        dismissLabel="Dismiss for the season"
        snoozeOptions={[
          { label: "1 week", onClick: () => setSnoozeWeeks(1) },
          { label: "2 weeks", onClick: () => setSnoozeWeeks(2) },
        ]}
        action={{ label: "Got it", onClick: () => setConfirmOpen(true) }}
      >
        <p className="max-w-[60ch]">
          {plantCount > 0 ? (
            <>
              <strong className="font-bold">{plantCount}</strong> plant{plantCount !== 1 ? "s haven't" : " hasn't"} been
              fertilized recently.
            </>
          ) : (
            "Your plants haven't been fertilized recently."
          )}{" "}
          Feeding during the growing season makes the biggest difference.
        </p>

        {/* Expandable plant list */}
        {visiblePlants.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-sm font-bold"
              aria-expanded={isExpanded}
            >
              <ChevronDown
                className={cn("w-4 h-4 transition-transform duration-200", isExpanded && "rotate-180")}
              />
              {isExpanded ? "Hide plants" : "Show plants"}
            </button>

            {isExpanded && (
              <ul className="mt-2.5 space-y-1.5">
                {visiblePlants.map((plant) => {
                  const isLogging = loggingId === plant.id;
                  return (
                    <li
                      key={plant.id}
                      className="flex items-center gap-3 rounded-[18px] bg-sprout-dark/[0.07] pl-4 pr-2 py-2"
                    >
                      <div className="min-w-0 flex-1 leading-tight">
                        <Link
                          to={`/my-plants/${plant.id}`}
                          className="text-[15px] font-bold hover:underline underline-offset-2 block truncate [min-height:unset]"
                        >
                          {plant.nickname || plant.plant_type || "Unnamed plant"}
                        </Link>
                        <span className="text-[13px] font-medium opacity-80 block mt-0.5">
                          Last fertilized: {daysSinceLabel(plant)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmLogPlantId(plant.id)}
                        disabled={isLogging}
                        className="shrink-0 h-10 px-3.5 rounded-xl bg-sprout-dark text-sprout-cream text-[13px] font-bold inline-flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {isLogging ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Log
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </HomeBanner>
    </>
  );
}
