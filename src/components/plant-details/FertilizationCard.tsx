import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, ChevronDown, AlertTriangle, Info, CheckCircle2, BookOpen, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserPlant } from "@/hooks/useUserPlants";
import type { CatalogPlant } from "@/data/types";
import {
  parseFertilizationFromCareInstructions,
  getFertilizationStatus,
} from "@/utils/plants/fertilizationAdvice";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FertilizationCardProps {
  plant: UserPlant;
  catalogPlant: CatalogPlant | undefined;
  onLogFertilization: () => Promise<void>;
  onAddJournalEntry: (title: string, content: string) => Promise<void>;
}

/** Notification key matching the banner — per-plant dismissal uses the same type but with plant_id set */
function seasonKey(): string {
  return `spring_fertilization_${new Date().getFullYear()}`;
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
    await supabase
      .from('notification_acknowledgements')
      .upsert(
        { user_id: user.id, notification_type: key, plant_id: plant.id, acknowledged_date: new Date().toISOString() },
        { onConflict: 'user_id,notification_type,plant_id' }
      );
  }, [user, key, lsKey, plant.id]);

  const advice = parseFertilizationFromCareInstructions(
    catalogPlant?.careInstructions ?? [],
    catalogPlant?.category
  );

  const status = getFertilizationStatus(plant, advice);

  const handleLogFertilization = async () => {
    setIsLogging(true);
    try {
      await onLogFertilization();
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

  // Build the status badge
  const renderBadge = () => {
    if (!status.isGrowingSeason) {
      return (
        <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
          Dormant season
        </Badge>
      );
    }
    if (isDismissed) {
      return (
        <span className="text-xs text-muted-foreground">Skipped this season</span>
      );
    }
    if (status.isDue) {
      return (
        <>
          <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30">
            Due now
          </Badge>
          <span className="text-xs text-muted-foreground">hasn't been fertilized recently</span>
        </>
      );
    }
    if (status.daysUntilDue !== null) {
      return (
        <span className="text-xs text-muted-foreground">
          Next in {status.daysUntilDue} day{status.daysUntilDue === 1 ? "" : "s"}
        </span>
      );
    }
    return null;
  };

  const lastFertilizedText = () => {
    if (status.daysSinceLastFertilized === null) return "Never logged";
    if (status.daysSinceLastFertilized === 0) return "Today";
    if (status.daysSinceLastFertilized === 1) return "Yesterday";
    return `${status.daysSinceLastFertilized} days ago`;
  };

  return (
    <Card
      className="mb-6 hover:border-plant-primary/50 transition-colors"
    >
      {/* Header row — always visible, click to toggle */}
      <CardContent
        className="flex items-center justify-between py-4 px-4 cursor-pointer"
        onClick={() => setIsExpanded(prev => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(prev => !prev);
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Fertilization</p>
            <div className="flex items-center gap-2 mt-0.5">
              {renderBadge()}
            </div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </CardContent>

      {/* Expanded body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t space-y-4">
          {/* Frequency and product type */}
          <div className="pt-3">
            <p className="text-sm text-foreground">
              <span className="font-medium">Feed {advice.frequencyLabel}</span>
              {advice.fertilizerType && (
                <span className="text-muted-foreground"> with {advice.fertilizerType.toLowerCase()}</span>
              )}
            </p>
            {advice.rawTip && (
              <blockquote className="mt-2 pl-3 border-l-2 border-sprout-primary/40 text-xs text-muted-foreground italic">
                {advice.rawTip}
              </blockquote>
            )}
          </div>

          {/* Last fertilized */}
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            Last fertilized: {lastFertilizedText()}
          </p>

          {/* Dormancy warning */}
          {!status.isGrowingSeason && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 dark:text-amber-300">
                Your plant is in its dormant season (fall/winter). Skip fertilizing until spring to avoid salt buildup and root damage.
              </p>
            </div>
          )}

          {/* Static repotting advisory — always shown */}
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-medium">Recently repotted?</span> Wait 6–8 weeks before fertilizing — fresh potting mix already has enough nutrients. Fertilizing too soon can burn recovering roots.
            </p>
          </div>

          {/* Log fertilization button — or post-log journal prompt */}
          {isDismissed && status.isGrowingSeason ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground p-2 rounded-md bg-muted/40">
              <span>Fertilization reminder skipped for this season.</span>
              <button
                onClick={() => { setIsDismissed(false); localStorage.removeItem(lsKey); }}
                className="text-xs underline underline-offset-2 hover:text-foreground ml-2 flex-shrink-0"
              >
                Undo
              </button>
            </div>
          ) : justLogged ? (
            <div className="space-y-3 p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {noteSaved ? "Note saved" : "Fertilization logged"}
              </div>
              {!noteSaved && (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Want to add a journal note? <span className="text-muted-foreground">(optional)</span></span>
                  </div>
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Used half-strength liquid fertilizer, leaves looking healthy…"
                    className="text-sm min-h-[72px] resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={!noteText.trim() || isSavingNote}
                      className="flex-1"
                    >
                      {isSavingNote ? "Saving…" : "Save note"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSkipNote}
                      className="flex-1"
                    >
                      Skip
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={handleLogFertilization}
                disabled={!status.isGrowingSeason || isLogging}
                className="w-full"
                title={!status.isGrowingSeason ? "Fertilizing during dormancy can damage your plant" : undefined}
              >
                {isLogging ? "Logging…" : "Log Fertilization"}
              </Button>
              {status.isGrowingSeason && status.isDue && (
                <button
                  onClick={handleDismissForSeason}
                  className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-1"
                >
                  <BellOff className="w-3 h-3" />
                  Skip reminder for this season
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default FertilizationCard;
