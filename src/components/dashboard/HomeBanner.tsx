import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tile colour for each season, used by the seasonal banners */
export const SEASON_TILE: Record<"spring" | "summer" | "fall" | "winter", string> = {
  spring: "bg-sprout-success",
  summer: "bg-sprout-cream",
  fall: "bg-sprout-warning",
  winter: "bg-sprout-water",
};

interface HomeBannerProps {
  testId?: string;
  /** Tile background, e.g. "bg-sprout-cream". Text is always sprout-dark, so pick a light tile. */
  tileClasses: string;
  icon: React.ElementType;
  /** Small filled pill above the title, e.g. "Growing season" */
  chip?: React.ReactNode;
  title: React.ReactNode;
  titleTestId?: string;
  onDismiss: () => void;
  dismissLabel: string;
  dismissTestId?: string;
  snoozeOptions?: { label: string; onClick: () => void; testId?: string }[];
  /** The one filled action at the bottom right */
  action?: { label: string; icon?: React.ElementType; onClick: () => void; testId?: string };
  children?: React.ReactNode;
}

/**
 * Reminder tile shown between the Home tiles and "Up next": fertilizing, seasonal reviews,
 * smart suggestions. One shape for all of them so they read as a set.
 */
export function HomeBanner({
  testId,
  tileClasses,
  icon: Icon,
  chip,
  title,
  titleTestId,
  onDismiss,
  dismissLabel,
  dismissTestId,
  snoozeOptions = [],
  action,
  children,
}: HomeBannerProps) {
  const ActionIcon = action?.icon;

  return (
    <section
      data-testid={testId}
      // overflow-clip, not overflow-hidden: hidden makes the tile a scroll container, so
      // scrolling a button into view could shift its contents under the decorative circle
      className={cn(
        "relative overflow-clip rounded-tile text-sprout-dark p-5 md:p-6 mb-2.5 md:mb-3.5",
        tileClasses
      )}
    >
      <div aria-hidden="true" className="absolute -right-12 -bottom-16 w-52 h-52 rounded-full bg-sprout-dark opacity-[0.07]" />

      <div className="relative flex items-start gap-3">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-sprout-dark text-sprout-cream flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          {chip && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-dark text-sprout-cream mb-1.5">
              {chip}
            </span>
          )}
          <h3 data-testid={titleTestId} className="font-display text-xl md:text-[22px] font-bold tracking-[-0.03em] leading-tight">
            {title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          data-testid={dismissTestId}
          className="w-10 h-10 shrink-0 rounded-xl bg-sprout-dark/10 flex items-center justify-center hover:bg-sprout-dark/15"
          aria-label={dismissLabel}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {children && <div className="relative text-[15px] font-medium mt-3">{children}</div>}

      {(snoozeOptions.length > 0 || action) && (
        <div className="relative flex flex-wrap items-center gap-1.5 mt-4">
          {snoozeOptions.length > 0 && <span className="text-[13px] font-bold mr-1">Remind me in</span>}
          {snoozeOptions.map((option, i) => (
            <button
              key={option.label}
              type="button"
              onClick={option.onClick}
              data-testid={option.testId}
              className="h-9 px-3 rounded-full border-[1.5px] border-sprout-dark text-[13px] font-bold inline-flex items-center gap-1.5 hover:bg-sprout-dark/10"
            >
              {i === 0 && <Clock className="h-3.5 w-3.5" />}
              {option.label}
            </button>
          ))}
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              data-testid={action.testId}
              className="h-10 px-4 rounded-full bg-sprout-dark text-sprout-cream text-[13px] font-bold ml-auto inline-flex items-center gap-1.5"
            >
              {ActionIcon && <ActionIcon className="h-4 w-4" />}
              {action.label}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
