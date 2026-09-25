import { OptionRow } from "@/components/onboarding/OnboardingUI";

interface OptionCardProps<T extends string> {
  value: T;
  currentValue: T | undefined;
  onClick: (value: T) => void;
  label: string;
  description?: string;
  testId?: string;
}

/** One wizard choice, drawn like the onboarding option rows */
export function OptionCard<T extends string>({
  value,
  currentValue,
  onClick,
  label,
  description,
  testId,
}: OptionCardProps<T>) {
  return (
    <OptionRow
      selected={currentValue === value}
      onClick={() => onClick(value)}
      label={label}
      description={description}
      testId={testId}
    />
  );
}

/** A labelled single-choice group of OptionCards */
export function OptionGroup({
  label,
  badge,
  footnote,
  children,
}: {
  label: string;
  /** Small pill after the label, e.g. "Auto-detected" */
  badge?: string;
  footnote?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-1.5 mb-2">
        <span className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">{label}</span>
        {badge && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sprout-water text-sprout-dark">{badge}</span>
        )}
      </div>
      <div role="radiogroup" aria-label={label} className="space-y-2">
        {children}
      </div>
      {footnote && <p className="text-[13px] text-muted-foreground px-1.5 mt-2">{footnote}</p>}
    </div>
  );
}

/** Step heading inside the wizard sheet */
export function WizardStepHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-1.5">
      <h3 className="font-display text-[22px] font-bold tracking-[-0.03em] leading-tight text-foreground">{title}</h3>
      <p className="text-[15px] text-muted-foreground mt-1">{body}</p>
    </div>
  );
}
