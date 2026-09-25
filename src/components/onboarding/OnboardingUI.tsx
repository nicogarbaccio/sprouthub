import { ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Big title and supporting line under the onboarding hero tiles. */
export function StepHeading({
  title,
  body,
  as: Heading = "h2",
}: {
  title: React.ReactNode;
  body: React.ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="px-1.5">
      <Heading className="font-display text-[30px] font-bold tracking-[-0.04em] leading-[1.05] text-foreground text-pretty">
        {title}
      </Heading>
      <p className="text-base leading-relaxed text-muted-foreground mt-2.5 text-pretty">{body}</p>
    </div>
  );
}

/** Selectable row used for single-choice onboarding questions. */
export function OptionRow({
  selected,
  onClick,
  label,
  description,
  testId,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "w-full min-h-[52px] rounded-[18px] px-4 py-3 text-left transition-colors",
        selected ? "bg-sprout-cream text-sprout-dark" : "bg-card text-foreground"
      )}
    >
      <span className="block font-bold text-[15px]">{label}</span>
      {description && (
        <span className={cn("block text-sm mt-0.5", selected ? "opacity-80" : "text-muted-foreground")}>
          {description}
        </span>
      )}
    </button>
  );
}

/** Square back button beside the wide primary action. */
export function StepNav({
  onBack,
  onNext,
  label,
  disabled,
  loading,
}: {
  onBack?: () => void;
  onNext: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="w-16 h-16 shrink-0 rounded-3xl bg-card text-foreground flex items-center justify-center disabled:opacity-50"
          aria-label="Back"
        >
          <ChevronLeft className="w-[22px] h-[22px]" strokeWidth={2.2} />
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={disabled || loading}
        className="flex-1 h-16 rounded-3xl bg-sprout-dark text-sprout-cream font-display font-bold text-base flex items-center justify-center gap-2 shadow-[inset_0_0_0_2px_#dfc490] disabled:opacity-50"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {label}
      </button>
    </div>
  );
}
