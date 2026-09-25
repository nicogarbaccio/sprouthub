import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { FlaskConical, ChevronDown, AlertTriangle, Info, CheckCircle2, BookOpen, BellOff, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FieldLabel,
  confirmCancelClasses,
  confirmDialogClasses,
  confirmIconClasses,
  confirmPrimaryClasses,
  confirmTitleClasses,
} from "@/components/settings/SettingsUI";
import { format } from "date-fns";
import type { UserPlant } from "@/hooks/useUserPlants";
import type { CatalogPlant } from "@/data/types";
import {
  parseFertilizationFromCareInstructions,
  getFertilizationStatus,
  getPlantFertilizationStatus,
} from "@/utils/plants/fertilizationAdvice";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FertilizationCardProps {
  plant: UserPlant;
  catalogPlant: CatalogPlant | undefined;
  onLogFertilization: (date?: Date) => Promise<void>;
  onAddJournalEntry: (title: string, content: string) => Promise<void>;
}

/** Notification key matching the banner — per-plant dismissal uses the same type but with plant_id set */
function seasonKey(): string {
  return `spring_fertilization_${new Date().getFullYear()}`;
}

const primaryButton =
  "h-12 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-[15px] shadow-[inset_0_0_0_2px_#dfc490] hover:bg-sprout-dark/90 disabled:opacity-50 disabled:shadow-none inline-flex items-center justify-center gap-2";
const secondaryButton = "h-12 rounded-[18px] bg-card text-foreground font-bold text-[15px] hover:bg-card/80";

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={cn("shrink-0 text-xs font-bold px-2.5 py-[3px] rounded-full", className)}>{children}</span>;
}

const FertilizationCard = ({
  plant,
  catalogPlant,
  onLogFertilization,
  onAddJournalEntry,
}: FertilizationCardProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [fertilizationDate, setFertilizationDate] = useState<Date>(new Date());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const key = seasonKey();
  const lsKey = `fertilization_dismissed_${key}_${plant.id}`;

  // Check if dismissed this season (localStorage fast path, then DB)
  useEffect(() => {
    if (localStorage.getItem(lsKey)) {
      setIsDismissed(true);
      return;
    }
    if (!user) return;
    supabase
      .from('notification_acknowledgements')
      .select('id')
      .eq('user_id', user.id)
      .eq('notification_type', key)
      .eq('plant_id', plant.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setIsDismissed(true);
      });
  }, [user, key, lsKey, plant.id]);

  const handleDismissForSeason = useCallback(async () => {
    setIsDismissed(true);
    localStorage.setItem(lsKey, '1');
    if (!user) return;
    // Delete + insert instead of upsert — the unique constraint includes
    // acknowledged_date so the 3-column onConflict target doesn't match.
    await supabase
      .from('notification_acknowledgements')
      .delete()
      .eq('user_id', user.id)
      .eq('notification_type', key)
      .eq('plant_id', plant.id);
    await supabase
      .from('notification_acknowledgements')
      .insert({
        user_id: user.id,
        notification_type: key,
        plant_id: plant.id,
        acknowledged_date: new Date().toISOString(),
      });
  }, [user, key, lsKey, plant.id]);

  // Prefer the catalog entry already resolved by the page; fall back to the shared
  // lookup so this card can never disagree with the banner or the room cards.
  const advice = catalogPlant
    ? parseFertilizationFromCareInstructions(
        catalogPlant.careInstructions ?? [],
        catalogPlant.category
      )
    : getPlantFertilizationStatus(plant).advice;

  const status = getFertilizationStatus(plant, advice);

  const handleLogFertilization = async () => {
    setConfirmOpen(false);
    setIsLogging(true);
    try {
      await onLogFertilization(fertilizationDate);
      setJustLogged(true);
      setNoteText("");
      setNoteSaved(false);
    } finally {
      setIsLogging(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setIsSavingNote(true);
    try {
      await onAddJournalEntry("Fertilization note", noteText.trim());
      setNoteSaved(true);
      setNoteText("");
      setTimeout(() => {
        setJustLogged(false);
        setNoteSaved(false);
      }, 1500);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSkipNote = () => {
    setJustLogged(false);
    setNoteText("");
    setNoteSaved(false);
  };

  // Status line under the card title
  const renderBadge = () => {
    if (!status.isGrowingSeason) {
      return <Pill className="bg-sprout-cream text-sprout-dark">Dormant season</Pill>;
    }
    if (isDismissed) {
      return <span className="text-[13px] text-muted-foreground">Skipped this season</span>;
    }
    if (status.isDue) {
      return (
        <>
          <Pill className="bg-sprout-success text-sprout-dark">Due now</Pill>
          <span className="text-[13px] text-muted-foreground truncate">hasn't been fertilized recently</span>
        </>
      );
    }
    if (status.daysUntilDue !== null) {
      return (
        <span className="text-[13px] text-muted-foreground">
          Next in {status.daysUntilDue} day{status.daysUntilDue === 1 ? "" : "s"}
        </span>
      );
    }
    return null;
  };

  const lastFertilizedText = () => {
    if (!plant.last_fertilized_at) return "Never logged";
    return format(new Date(plant.last_fertilized_at), "MMM d, yyyy");
  };

  return (
    <>
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) setConfirmOpen(false);
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
              This will record{" "}
              <strong className="text-foreground font-bold">
                {format(fertilizationDate, "MMM d, yyyy")}
              </strong>{" "}
              as the last fertilization for{" "}
              <strong className="text-foreground font-bold">
                {plant.nickname || plant.plant_type || "this plant"}
              </strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={confirmCancelClasses}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogFertilization}
              className={confirmPrimaryClasses}
            >
              Yes, log it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <section className="rounded-card bg-card">
      {/* Header row — always visible, tap to toggle */}
      <button
        type="button"
        className="w-full flex items-center gap-3.5 p-[18px] text-left"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
      >
        <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-success text-sprout-dark flex items-center justify-center">
          <FlaskConical className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-foreground">Fertilization</p>
          <div className="flex items-center gap-2 mt-0.5 min-w-0">{renderBadge()}</div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="px-[18px] pb-[18px] space-y-2">
          {/* Frequency and product type */}
          <div className="rounded-[18px] bg-field p-4">
            <p className="text-[15px] text-foreground">
              <span className="font-bold">Feed {advice.frequencyLabel}</span>
              {advice.fertilizerType && (
                <span className="text-muted-foreground"> with {advice.fertilizerType.toLowerCase()}</span>
              )}
            </p>
            {advice.rawTip && (
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{advice.rawTip}</p>
            )}
            <p className="mt-2 text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Last fertilized: {lastFertilizedText()}
            </p>
          </div>

          {/* Dormancy warning */}
          {!status.isGrowingSeason && (
            <div className="flex items-start gap-2.5 rounded-[18px] bg-sprout-cream text-sprout-dark p-4 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Your plant is in its dormant season (fall/winter). Skip fertilizing until spring to avoid salt buildup and root damage.
              </p>
            </div>
          )}

          {/* Static repotting advisory — always shown */}
          <div className="flex items-start gap-2.5 rounded-[18px] bg-field p-4 text-[13px] text-muted-foreground leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <span className="font-bold text-foreground">Recently repotted?</span> Wait 6–8 weeks before fertilizing — fresh potting mix already has enough nutrients. Fertilizing too soon can burn recovering roots.
            </p>
          </div>

          {/* Log fertilization button — or post-log journal prompt */}
          {isDismissed && status.isGrowingSeason ? (
            <div className="flex items-center justify-between gap-2 rounded-[18px] bg-field px-4 py-3 text-[13px] text-muted-foreground">
              <span>Fertilization reminder skipped for this season.</span>
              <button
                type="button"
                onClick={() => { setIsDismissed(false); localStorage.removeItem(lsKey); }}
                className="shrink-0 font-bold text-link"
              >
                Undo
              </button>
            </div>
          ) : justLogged ? (
            <div className="space-y-2.5 rounded-[18px] bg-sprout-success/15 p-4">
              <div className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-sprout-success" />
                {noteSaved ? "Note saved" : "Fertilization logged"}
              </div>
              {!noteSaved && (
                <>
                  <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>Want to add a journal note? (optional)</span>
                  </div>
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Used half-strength liquid fertilizer, leaves looking healthy…"
                    className="min-h-[72px] resize-none rounded-2xl border-0 bg-card px-4 py-3 text-[15px] focus-visible:ring-2 focus-visible:ring-offset-0"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSkipNote} className={cn(secondaryButton, "flex-1")}>
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      disabled={!noteText.trim() || isSavingNote}
                      className={cn(primaryButton, "flex-[1.4]")}
                    >
                      {isSavingNote ? "Saving…" : "Save note"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div>
                <FieldLabel>Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-12 rounded-2xl bg-field px-4 inline-flex items-center gap-2 text-[15px] font-semibold text-foreground"
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {format(fertilizationDate, 'PPP')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fertilizationDate}
                      onSelect={(date) => date && setFertilizationDate(date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={!status.isGrowingSeason || isLogging}
                className={cn(primaryButton, "w-full")}
                title={!status.isGrowingSeason ? "Fertilizing during dormancy can damage your plant" : undefined}
              >
                <FlaskConical className="w-4 h-4" />
                {isLogging ? "Logging…" : "Log Fertilization"}
              </button>
              {status.isGrowingSeason && status.isDue && (
                <button
                  type="button"
                  onClick={handleDismissForSeason}
                  className="w-full text-[13px] font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-1"
                >
                  <BellOff className="w-3.5 h-3.5" />
                  Skip reminder for this season
                </button>
              )}
            </div>
          )}
        </div>
      )}
      </section>
    </>
  );
};

export default FertilizationCard;
