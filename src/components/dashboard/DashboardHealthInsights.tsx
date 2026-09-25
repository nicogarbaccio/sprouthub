import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Droplets,
  Plus,
  Star,
} from "lucide-react";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { cn } from "@/lib/utils";

interface DashboardHealthInsightsProps {
  totalPlants: number;
  plantsWithoutWateringData: number;
  overduePlants: number;
  plantsNeedingWaterToday: number;
  plantsUpcomingSoon: number;
  hasActiveCareRoutine: boolean;
  hasCareStreak: boolean;
  onAddPlant: () => void;
  onNavigate: (path: string) => void;
}

const plural = (n: number) => `${n} plant${n === 1 ? "" : "s"}`;

export function DashboardHealthInsights({
  totalPlants,
  plantsWithoutWateringData,
  overduePlants,
  plantsNeedingWaterToday,
  plantsUpcomingSoon,
  hasActiveCareRoutine,
  hasCareStreak,
  onAddPlant,
  onNavigate,
}: DashboardHealthInsightsProps) {
  const thriving = totalPlants - plantsWithoutWateringData - overduePlants;
  const share = totalPlants > 0 ? thriving / totalPlants : 0;
  const percent = Math.round(share * 100);
  const rating = share >= 0.9 ? "Excellent" : share >= 0.7 ? "Good" : "Needs care";

  const allClear =
    overduePlants === 0 && plantsWithoutWateringData === 0 && plantsNeedingWaterToday === 0;

  return (
    <CascadingContainer delay={400}>
      <section data-testid="plant-health-insights-card" aria-labelledby="plant-health-heading" className="mb-8">
        <div className="px-1.5 md:px-1">
          <h2
            id="plant-health-heading"
            className="font-display text-xl md:text-[22px] font-bold tracking-[-0.03em] text-foreground"
          >
            Plant health
          </h2>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">
            Recommendations to keep your plants thriving
          </p>
        </div>

        {totalPlants === 0 ? (
          <EmptyState onAddPlant={onAddPlant} onNavigate={onNavigate} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3.5 mt-3">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2.5 md:gap-3.5 content-start">
              <div className="col-span-3 rounded-tile bg-sprout-primary text-sprout-cream p-5 md:p-6 flex items-center gap-5">
                <div className="font-display text-[56px] md:text-[64px] font-extrabold leading-none tracking-[-0.05em] tabular-nums">
                  {percent}%
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold">Overall health</span>
                    <span
                      className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-full text-sprout-dark",
                        share >= 0.9 ? "bg-sprout-success" : share >= 0.7 ? "bg-sprout-cream" : "bg-sprout-warning"
                      )}
                    >
                      {rating}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-1 opacity-90">
                    {thriving} of {totalPlants} plants thriving
                  </p>
                </div>
              </div>

              <Metric
                label="Thriving"
                count={thriving}
                total={totalPlants}
                icon={CheckCircle2}
                activeClasses="bg-sprout-success text-sprout-dark"
              />
              <Metric
                label="Overdue"
                count={overduePlants}
                total={totalPlants}
                icon={AlertTriangle}
                activeClasses="bg-sprout-warning text-sprout-dark"
              />
              <Metric
                label="No schedule"
                count={plantsWithoutWateringData}
                total={totalPlants}
                icon={Clock}
                activeClasses="bg-sprout-cream text-sprout-dark"
              />
            </div>

            {/* Recommendations */}
            <div className="flex flex-col gap-2.5 md:gap-3.5">
              {overduePlants > 0 && (
                <Recommendation
                  testId="overdue-plants-warning"
                  classes="bg-sprout-warning text-sprout-dark"
                  icon={AlertTriangle}
                  title="Water needed"
                  count={plural(overduePlants)}
                  body={
                    overduePlants === 1
                      ? "One plant is overdue for watering and needs attention today."
                      : `${overduePlants} plants are overdue for watering and need attention today.`
                  }
                />
              )}

              {plantsWithoutWateringData > 0 && (
                <Recommendation
                  testId="missing-watering-data-warning"
                  classes="bg-sprout-cream text-sprout-dark"
                  icon={Droplets}
                  title="Setup required"
                  count={plural(plantsWithoutWateringData)}
                  body={
                    plantsWithoutWateringData === 1
                      ? "One plant has no watering history yet. Water it once to start its schedule."
                      : `${plantsWithoutWateringData} plants have no watering history yet. Water them once to start their schedules.`
                  }
                />
              )}

              {plantsNeedingWaterToday > 0 && overduePlants === 0 && (
                <Recommendation
                  classes="bg-sprout-water text-sprout-dark"
                  icon={Droplets}
                  title="Watering today"
                  count={plural(plantsNeedingWaterToday)}
                  body={
                    plantsNeedingWaterToday === 1
                      ? "One plant is due for watering today, right on schedule."
                      : `${plantsNeedingWaterToday} plants are due for watering today, right on schedule.`
                  }
                />
              )}

              {allClear && (
                <Recommendation
                  testId="all-plants-healthy-message"
                  classes="bg-sprout-success text-sprout-dark"
                  icon={CheckCircle2}
                  title="All clear"
                  body="Every plant is on schedule. No action needed, so keep up the great work."
                />
              )}

              {plantsUpcomingSoon > 0 && (
                <Recommendation
                  classes="bg-card text-foreground"
                  iconClasses="bg-field text-foreground"
                  icon={Calendar}
                  title="Coming up soon"
                  count={plural(plantsUpcomingSoon)}
                  body={
                    plantsUpcomingSoon === 1
                      ? "One plant will need water in the next 1–2 days."
                      : `${plantsUpcomingSoon} plants will need water in the next 1–2 days.`
                  }
                />
              )}

              {hasActiveCareRoutine && hasCareStreak && plantsNeedingWaterToday === 0 && (
                <Recommendation
                  classes="bg-sprout-primary text-sprout-cream"
                  iconClasses="bg-sprout-cream text-sprout-dark"
                  icon={Star}
                  title="On a roll"
                  body="Your recent waterings have all been on time. Keep the momentum going."
                />
              )}
            </div>
          </div>
        )}
      </section>
    </CascadingContainer>
  );
}

function Metric({
  label,
  count,
  total,
  icon: Icon,
  activeClasses,
}: {
  label: string;
  count: number;
  total: number;
  icon: React.ElementType;
  activeClasses: string;
}) {
  const active = count > 0;
  return (
    <div
      className={cn(
        "rounded-card p-3.5 md:p-4 flex flex-col justify-between gap-3 min-h-[120px]",
        active ? activeClasses : "bg-card text-foreground"
      )}
    >
      <Icon className={cn("w-5 h-5", !active && "text-muted-foreground")} />
      <div>
        <div className="font-display text-[28px] font-extrabold leading-none tabular-nums">{count}</div>
        <div className={cn("text-[13px] font-bold mt-1", !active && "text-muted-foreground")}>{label}</div>
        <div
          className={cn("mt-2 h-1.5 rounded-full overflow-hidden", active ? "bg-sprout-dark/15" : "bg-field")}
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-current motion-safe:transition-[width] motion-safe:duration-700"
            style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Recommendation({
  classes,
  iconClasses = "bg-sprout-dark text-sprout-cream",
  icon: Icon,
  title,
  count,
  body,
  testId,
}: {
  classes: string;
  iconClasses?: string;
  icon: React.ElementType;
  title: string;
  count?: string;
  body: string;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className={cn("rounded-card p-4 md:p-5 flex items-start gap-3.5", classes)}>
      <div
        className={cn("w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center", iconClasses)}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-lg font-bold tracking-[-0.02em]">{title}</h3>
          {count && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sprout-dark/15">{count}</span>
          )}
        </div>
        <p className="text-sm font-medium mt-1 opacity-90 text-pretty">{body}</p>
      </div>
    </div>
  );
}

function EmptyState({
  onAddPlant,
  onNavigate,
}: {
  onAddPlant: () => void;
  onNavigate: (path: string) => void;
}) {
  const steps = [
    { title: "Add a plant", body: "Give it a nickname" },
    { title: "Set a schedule", body: "Or let the Smart Wizard pick" },
    { title: "Track care", body: "Get reminders when it's due" },
  ];
  return (
    <div
      data-testid="add-first-plant-prompt"
      className="mt-3 rounded-tile bg-sprout-cream text-sprout-dark p-5 md:p-7 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -bottom-16 w-56 h-56 rounded-full bg-sprout-dark opacity-[0.08]"
      />
      <h3 className="relative font-display text-2xl font-bold tracking-[-0.03em]">Start your plant journey</h3>
      <p className="relative text-[15px] font-medium mt-1.5 max-w-[46ch]">
        Add your first plant to unlock smart watering schedules, care reminders, and personalized insights.
      </p>
      <div className="relative flex flex-wrap gap-2 mt-4">
        <button
          data-testid="add-first-plant-button"
          onClick={onAddPlant}
          className="h-12 px-5 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-[15px] inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Add your first plant
        </button>
        <button
          onClick={() => onNavigate("/plant-catalog")}
          className="h-12 px-5 rounded-[18px] border-[1.5px] border-sprout-dark font-bold text-[15px]"
        >
          Browse the catalog
        </button>
      </div>
      <ol className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-2.5 rounded-2xl bg-sprout-dark/[0.07] p-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-sprout-dark text-sprout-cream text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span>
              <span className="block text-sm font-bold">{step.title}</span>
              <span className="block text-xs font-medium opacity-80">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
