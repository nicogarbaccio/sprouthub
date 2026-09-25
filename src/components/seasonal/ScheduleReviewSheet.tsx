import { useState } from "react";
import { ArrowRight, CheckCircle, Loader2, MapPin, Minus, Pencil, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetPrimaryButtonClasses,
  sheetSecondaryButtonClasses,
  sheetTitleClasses,
} from "@/components/ui/bento-sheet";

/** One plant's suggested schedule change, in a shape both seasonal reviews can produce */
export interface ScheduleReviewItem {
  plantId: string;
  nickname: string;
  plantType?: string;
  isOutdoor?: boolean;
  currentDays: number;
  suggestedDays: number;
  reasoning: string[];
  /** Small pills beside the name, e.g. confidence and what the suggestion is based on */
  tags?: string[];
  /** e.g. "Last year: 9 days (good performance)" */
  note?: string;
  /** Set once the plant's schedule has been updated; the number is the new schedule when known */
  applied: false | { days?: number };
}

interface ScheduleReviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  icon: React.ElementType;
  /** Tile colour for the header icon, e.g. SEASON_TILE[season] */
  iconClasses: string;
  title: string;
  description: string;
  items: ScheduleReviewItem[];
  isLoading: boolean;
  /** `custom` is true when the user changed the suggested number themselves */
  onApply: (plantId: string, days: number, custom: boolean) => Promise<void>;
  onApplyAll: () => Promise<void>;
  maxCustomDays: number;
  testId?: string;
  titleTestId?: string;
}

/** Review sheet for seasonal schedule suggestions: one card per plant, apply one or all */
export function ScheduleReviewSheet({
  isOpen,
  onClose,
  icon: Icon,
  iconClasses,
  title,
  description,
  items,
  isLoading,
  onApply,
  onApplyAll,
  maxCustomDays,
  testId,
  titleTestId,
}: ScheduleReviewSheetProps) {
  const [editing, setEditing] = useState<{ plantId: string; days: number } | null>(null);
  const pending = items.filter((item) => !item.applied);

  const stats = [
    { label: "Plants", value: items.length, classes: "bg-card text-foreground" },
    { label: "Updated", value: items.length - pending.length, classes: "bg-sprout-success text-sprout-dark" },
    { label: "Pending", value: pending.length, classes: "bg-sprout-cream text-sprout-dark" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid={testId} className={cn(dialogSheetClasses, "sm:max-w-2xl")}>
        <SheetGrabber />
        <DialogHeader className={sheetHeaderClasses}>
          <div className={cn("w-[52px] h-[52px] shrink-0 rounded-[18px] text-sprout-dark flex items-center justify-center", iconClasses)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle data-testid={titleTestId} className={sheetTitleClasses}>
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium">{description}</DialogDescription>
          </div>
          <button type="button" onClick={onClose} className={cn(sheetIconButtonClasses, "self-start")} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-3 gap-2" data-testid="seasonal-summary-stats">
            {stats.map((stat) => (
              <div key={stat.label} className={cn("rounded-[22px] p-3.5", stat.classes)}>
                <div className="text-xs font-bold uppercase tracking-[0.8px] opacity-90">{stat.label}</div>
                <div className="font-display text-2xl font-extrabold mt-1">{stat.value}</div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="rounded-3xl bg-card p-5">
              <p className="text-[15px] font-bold text-foreground">No adjustments needed</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your current watering schedules suit the new season.
              </p>
            </div>
          )}

          {items.map((item) => {
            const isEditing = editing?.plantId === item.plantId;
            const shownDays = item.applied ? item.applied.days ?? item.suggestedDays : isEditing ? editing.days : item.suggestedDays;
            const setDays = (days: number) =>
              setEditing({ plantId: item.plantId, days: Math.max(1, Math.min(maxCustomDays, days)) });

            return (
              <section
                key={item.plantId}
                data-testid={`seasonal-suggestion-${item.plantId}`}
                className={cn("rounded-3xl bg-card p-4", item.applied && "opacity-75")}
              >
                <div className="flex items-start gap-2 flex-wrap">
                  <h4 className="font-display text-lg font-bold tracking-[-0.02em] text-foreground mr-auto flex items-center gap-2">
                    {item.nickname}
                    {item.applied && <CheckCircle className="w-5 h-5 text-sprout-success" aria-label="Updated" />}
                  </h4>
                  {item.plantType && <Tag>{item.plantType}</Tag>}
                  {item.isOutdoor && (
                    <Tag>
                      <MapPin className="w-3 h-3" />
                      Outdoor
                    </Tag>
                  )}
                  {item.tags?.map((tag) => <Tag key={tag}>{tag}</Tag>)}
                </div>

                {/* Current → suggested */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mt-3">
                  <div className="rounded-[18px] bg-field p-3">
                    <div className="text-xs font-bold uppercase tracking-[0.8px] text-muted-foreground">
                      {item.applied ? "Was" : "Now"}
                    </div>
                    <div className={cn("font-display text-lg font-bold text-foreground mt-0.5", item.applied && "line-through opacity-60")}>
                      {item.currentDays} days
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" aria-label="changes to" />
                  <div
                    className={cn(
                      "rounded-[18px] p-3 text-sprout-dark",
                      item.applied ? "bg-sprout-success" : "bg-sprout-water"
                    )}
                  >
                    <div className="text-xs font-bold uppercase tracking-[0.8px]">
                      {item.applied ? "Updated" : isEditing ? "Custom" : "Suggested"}
                    </div>
                    <div className="font-display text-lg font-bold mt-0.5" aria-live="polite">
                      {shownDays} days
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[13px] font-bold text-muted-foreground px-1 mr-auto">Adjust the days</span>
                    <button
                      type="button"
                      onClick={() => setDays(editing.days - 1)}
                      disabled={editing.days <= 1}
                      className="w-11 h-11 rounded-[14px] bg-field text-foreground flex items-center justify-center disabled:opacity-40"
                      aria-label="Fewer days"
                    >
                      <Minus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDays(editing.days + 1)}
                      disabled={editing.days >= maxCustomDays}
                      className="w-11 h-11 rounded-[14px] bg-field text-foreground flex items-center justify-center disabled:opacity-40"
                      aria-label="More days"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                )}

                {item.reasoning.length > 0 && (
                  <ul className="space-y-1.5 mt-3">
                    {item.reasoning.map((reason, i) => (
                      <li key={i} className="text-sm text-muted-foreground leading-snug flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sprout-light mt-1.5 shrink-0" aria-hidden="true" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
                {item.note && <p className="text-[13px] font-semibold text-foreground mt-2">{item.note}</p>}

                {!item.applied && (
                  <div className="flex gap-2 mt-3">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="flex-1 h-11 rounded-[16px] bg-field text-foreground font-bold text-sm"
                          data-testid={`cancel-custom-${item.plantId}`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onApply(item.plantId, editing.days, true);
                            setEditing(null);
                          }}
                          disabled={isLoading}
                          className="flex-[1.4] h-11 rounded-[16px] bg-sprout-dark text-sprout-cream font-bold text-sm shadow-[inset_0_0_0_2px_#dfc490] disabled:opacity-60"
                          data-testid={`apply-custom-${item.plantId}`}
                        >
                          Apply {editing.days} days
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing({ plantId: item.plantId, days: item.suggestedDays })}
                          className="flex-1 h-11 rounded-[16px] bg-field text-foreground font-bold text-sm inline-flex items-center justify-center gap-1.5"
                          data-testid={`customize-suggestion-${item.plantId}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Customize
                        </button>
                        <button
                          type="button"
                          onClick={() => onApply(item.plantId, item.suggestedDays, false)}
                          disabled={isLoading}
                          className="flex-[1.4] h-11 rounded-[16px] bg-sprout-dark text-sprout-cream font-bold text-sm shadow-[inset_0_0_0_2px_#dfc490] disabled:opacity-60"
                          data-testid={`apply-suggestion-${item.plantId}`}
                        >
                          Apply Suggestion
                        </button>
                      </>
                    )}
                  </div>
                )}
              </section>
            );
          })}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={cn(sheetSecondaryButtonClasses, "flex-1")}
              data-testid="close-seasonal-review-button"
            >
              Done
            </button>
            {pending.length > 0 && (
              <button
                type="button"
                onClick={onApplyAll}
                disabled={isLoading}
                className={cn(sheetPrimaryButtonClasses, "flex-[1.4]")}
                data-testid="apply-all-suggestions-button"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isLoading ? "Applying..." : `Apply All (${pending.length})`}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-field text-foreground">
      {children}
    </span>
  );
}
