import { cn } from "@/lib/utils";
import { phoneSheetClasses } from "@/components/ui/bento-sheet";

/**
 * Shared bento building blocks for Settings and Profile, so every tab reads the same:
 * white cards with a display-font heading, inset rows for toggles, chip-style choices, and
 * one dark primary button.
 */

/** Tailwind classes for inputs and select triggers sitting inside a settings card */
export const settingsInputClasses =
  "h-12 rounded-2xl border-0 bg-field text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-0";

/** The one filled action per card (save, update, change password) */
export const settingsPrimaryButtonClasses =
  "w-full h-14 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-[15px] shadow-[inset_0_0_0_2px_#dfc490] hover:bg-sprout-dark/90 disabled:opacity-50 disabled:shadow-none inline-flex items-center justify-center gap-2 transition-opacity";

/** A secondary action next to or instead of the primary one */
export const settingsSecondaryButtonClasses =
  "h-14 px-5 rounded-[18px] bg-field text-foreground font-bold text-[15px] hover:bg-field/80 disabled:opacity-50 inline-flex items-center justify-center gap-2";

interface SettingsCardProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ElementType;
  /** Tints the icon square; the card itself stays white so the page doesn't get noisy */
  iconClasses?: string;
  /** Right-aligned header control, e.g. a reset link */
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Extra classes for the body under the header, e.g. to make it grow */
  bodyClassName?: string;
  testId?: string;
}

export function SettingsCard({
  title,
  description,
  icon: Icon,
  iconClasses = "bg-field text-foreground",
  action,
  children,
  className,
  bodyClassName,
  testId,
}: SettingsCardProps) {
  return (
    <section className={cn("rounded-card bg-card text-card-foreground p-5 md:p-6", className)} data-testid={testId}>
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className={cn("w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center", iconClasses)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-foreground">{title}</h2>
          {description && <p className="text-sm font-medium text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className={cn("mt-5 space-y-3", bodyClassName)}>{children}</div>}
    </section>
  );
}

/** A labelled heading inside a card, grouping a few rows */
export function SettingsGroup({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-2 first:pt-0">
      <h3 className="text-base font-bold text-foreground flex items-center gap-2 px-1">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        {title}
      </h3>
      {description && <p className="text-sm text-muted-foreground px-1 mt-0.5">{description}</p>}
      <div className="mt-2.5 space-y-2">{children}</div>
    </div>
  );
}

/** Inset row with a label on the left and a control (usually a Switch) on the right */
export function SettingRow({
  label,
  description,
  htmlFor,
  control,
  className,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Id of the control, so clicking the label toggles it and it gets an accessible name */
  htmlFor?: string;
  control: React.ReactNode;
  className?: string;
}) {
  const Label = htmlFor ? "label" : "div";
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-[18px] bg-field px-4 py-3.5 min-h-[60px]", className)}>
      <Label htmlFor={htmlFor} className={cn("flex-1 min-w-0", htmlFor && "cursor-pointer")}>
        <span className="block text-[15px] font-bold text-foreground">{label}</span>
        {description && <span className="block text-[13px] text-muted-foreground mt-0.5">{description}</span>}
      </Label>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

/** Row of chip-style single-choice options */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  getLabel,
  ariaLabel,
}: {
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={cn(
              "min-h-[52px] rounded-[18px] px-4 py-3 text-[15px] font-bold text-center transition-colors",
              selected ? "bg-sprout-cream text-sprout-dark" : "bg-field text-foreground hover:bg-field/70"
            )}
          >
            {getLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

/** A full-width TabsList that scrolls sideways on narrow screens */
export const pillTabsListClasses = "w-full justify-start overflow-x-auto scrollbar-none";

/** Small uppercase field label, matching the eyebrow labels used across the app */
export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1 mb-1.5"
    >
      {children}
    </label>
  );
}

/** Confirm dialogs (AlertDialogContent) in the bento style: a bottom sheet on phones */
export const confirmDialogClasses = `border-0 bg-background sm:rounded-[32px] ${phoneSheetClasses}`;
export const confirmTitleClasses = "font-display text-2xl font-bold tracking-[-0.03em]";
export const confirmCancelClasses = "h-12 rounded-[18px] border-0 bg-card font-bold";
/** The confirming action when nothing is being destroyed */
export const confirmPrimaryClasses =
  "h-12 rounded-[18px] bg-sprout-dark text-sprout-cream hover:bg-sprout-dark/90 font-bold shadow-[inset_0_0_0_2px_#dfc490]";
/** Header row of a confirm dialog: a tinted icon square beside the title */
export const confirmIconClasses = "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center";
/** The irreversible action: terracotta, never red */
export const confirmDestructiveClasses =
  "h-12 rounded-[18px] bg-sprout-warning text-sprout-dark hover:bg-sprout-warning/90 font-bold";
