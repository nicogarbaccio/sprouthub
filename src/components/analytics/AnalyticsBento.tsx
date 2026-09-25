import { Link } from "react-router-dom";
import { format, startOfMonth } from "date-fns";
import { Award, CalendarDays, CalendarRange, Droplets, FlaskConical, Lightbulb, Target } from "lucide-react";
import PlantImage from "@/components/ui/plant-image";
import { capitalize, cn } from "@/lib/utils";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";
import { getPlantImageUrl } from "@/utils/plants/images";
import { getMoodConfig, type PlantMood } from "@/types/journalTypes";
import type { SeasonalScheduleRow } from "@/hooks/useAnalyticsData";
import type {
  FertilizationSummary,
  Insight,
  PlantHealthStats,
  PlantPerformance,
  PlantRef,
  TimeDistribution,
  WateringHabits,
  WateringStats,
} from "@/utils/analytics";

/* ─── Stat tiles ──────────────────────────────────────────────────────────── */

interface AnalyticsTilesProps {
  stats: WateringStats;
  streak: { days: number; onTimeRate: number | null; lookbackDays: number };
}

export function AnalyticsTiles({ stats, streak }: AnalyticsTilesProps) {
  const percent = streak.onTimeRate !== null ? Math.round(streak.onTimeRate * 100) : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5">
      <StatTile
        className="bg-sprout-primary text-sprout-cream"
        icon={Award}
        eyebrow="Care streak"
        value={streak.days}
        unit={streak.days === 1 ? "day" : "days"}
        detail={percent !== null ? `${percent}% on time, last ${streak.lookbackDays} days` : "Builds as you water"}
        testId="analytics-streak-tile"
      />
      <StatTile
        className="bg-sprout-water text-sprout-dark"
        icon={Droplets}
        eyebrow="Waterings"
        value={stats.totalWaterings}
        detail="Last 90 days"
      />
      <StatTile
        className="bg-sprout-cream text-sprout-dark"
        icon={CalendarDays}
        eyebrow="This week"
        value={stats.thisWeek}
        detail={`Avg ${stats.averagePerWeek} a week`}
      />
      <StatTile
        className="bg-card text-foreground"
        quiet
        icon={Target}
        eyebrow="This month"
        value={stats.thisMonth}
        detail={`Since ${format(startOfMonth(new Date()), "MMM d")}`}
      />
    </div>
  );
}

function StatTile({
  className,
  quiet,
  icon: Icon,
  eyebrow,
  value,
  unit,
  detail,
  testId,
}: {
  className: string;
  /** White tile: labels go muted so the number carries it */
  quiet?: boolean;
  icon: React.ElementType;
  eyebrow: string;
  value: number;
  unit?: string;
  detail: string;
  testId?: string;
}) {
  return (
    <div
      className={cn("rounded-card p-4 md:p-5 min-h-[132px] md:min-h-[150px] flex flex-col justify-between gap-3", className)}
      data-testid={testId}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-xs font-bold tracking-[0.8px] uppercase truncate", quiet && "text-muted-foreground")}>
          {eyebrow}
        </span>
        <Icon className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[34px] md:text-[42px] font-extrabold leading-none tracking-[-0.04em]">
            {value}
          </span>
          {unit && <span className="text-sm font-bold">{unit}</span>}
        </div>
        <div className={cn("text-[13px] md:text-sm font-bold mt-1.5 leading-snug", quiet && "text-muted-foreground")}>
          {detail}
        </div>
      </div>
    </div>
  );
}

/* ─── Section card ────────────────────────────────────────────────────────── */

export function AnalyticsCard({
  title,
  description,
  icon: Icon,
  iconClasses = "bg-field text-foreground",
  children,
  className,
  testId,
}: {
  title: string;
  description?: React.ReactNode;
  icon: React.ElementType;
  iconClasses?: string;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section className={cn("rounded-tile bg-card text-card-foreground p-5 md:p-6", className)} data-testid={testId}>
      <div className="flex items-start gap-3.5">
        <div className={cn("w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center", iconClasses)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-foreground">{title}</h2>
          {description && <p className="text-sm font-medium text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[18px] bg-field px-4 py-5 text-sm font-medium text-muted-foreground text-center">
      {children}
    </p>
  );
}

/* ─── Insights ────────────────────────────────────────────────────────────── */

export function InsightsCard({ insights }: { insights: Insight[] }) {
  return (
    <AnalyticsCard title="Key insights" icon={Lightbulb} iconClasses="bg-sprout-cream text-sprout-dark">
      <ul className="space-y-2">
        {insights.map((insight, idx) => (
          <li key={idx} className="rounded-[18px] bg-field px-4 py-3 text-[15px] leading-snug text-foreground">
            {insight.names && <span className="font-bold">{insight.names}</span>}
            {insight.names ? " — " : ""}
            {insight.message}
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}

/* ─── Watering status and habits ──────────────────────────────────────────── */

/** One coloured group of plants: a dot, a label, a count, and the plants as chips */
function PlantGroup({
  label,
  dotClass,
  plants,
  note,
}: {
  label: string;
  dotClass: string;
  plants: PlantRef[];
  /** Optional hint after a plant's name, e.g. "runs late" */
  note?: (plant: PlantRef) => string | null;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("w-3 h-3 rounded-full", dotClass)} aria-hidden="true" />
          <span className="text-[15px] font-bold text-foreground">{label}</span>
        </div>
        <span className="font-display text-lg font-bold text-foreground">{plants.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {plants.map((plant) => {
          const hint = note?.(plant);
          return (
            <Link
              key={plant.id}
              to={`/my-plants/${plant.id}`}
              className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-field text-foreground hover:bg-field/70"
            >
              {plant.name}
              {hint && <span className="font-medium text-muted-foreground"> · {hint}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface StatusCardProps {
  health: PlantHealthStats;
  note: (plant: PlantRef) => string | null;
}

export function WateringStatusCard({ health, note }: StatusCardProps) {
  const overdueIds = new Set(health.lists.overdue.map((p) => p.id));
  // `needsAttention` also holds the overdue plants; split them so each plant shows once
  const dueSoon = health.lists.needsAttention.filter((p) => !overdueIds.has(p.id));
  const tracked = health.lists.overdue.length + dueSoon.length + health.lists.onSchedule.length;
  const untracked = health.totalPlants - tracked;

  const segments = [
    { key: "on-schedule", label: "On schedule", count: health.lists.onSchedule.length, className: "bg-sprout-success" },
    { key: "due-soon", label: "Due soon", count: dueSoon.length, className: "bg-sprout-water" },
    { key: "overdue", label: "Overdue", count: health.lists.overdue.length, className: "bg-sprout-warning" },
  ];

  return (
    <AnalyticsCard
      title="Right now"
      description={`Where your ${health.totalPlants} ${health.totalPlants === 1 ? "plant stands" : "plants stand"} today`}
      icon={Droplets}
      iconClasses="bg-sprout-water text-sprout-dark"
      testId="analytics-status-card"
    >
      {tracked === 0 ? (
        <EmptyNote>Log a watering to start tracking your plants' schedules.</EmptyNote>
      ) : (
        <div className="space-y-5">
          <div
            className="flex h-3.5 rounded-full overflow-hidden bg-field gap-0.5"
            role="img"
            aria-label={segments.map((s) => `${s.count} ${s.label.toLowerCase()}`).join(", ")}
          >
            {segments
              .filter((s) => s.count > 0)
              .map((s) => (
                <div key={s.key} className={s.className} style={{ width: `${(s.count / tracked) * 100}%` }} />
              ))}
          </div>

          {health.lists.overdue.length > 0 && (
            <PlantGroup label="Overdue" dotClass="bg-sprout-warning" plants={health.lists.overdue} note={note} />
          )}
          {dueSoon.length > 0 && (
            <PlantGroup label="Due today or tomorrow" dotClass="bg-sprout-water" plants={dueSoon} note={note} />
          )}
          {health.lists.onSchedule.length > 0 && (
            <PlantGroup label="On schedule" dotClass="bg-sprout-success" plants={health.lists.onSchedule} note={note} />
          )}
          {untracked > 0 && (
            <p className="text-[13px] font-medium text-muted-foreground px-1">
              {untracked} {untracked === 1 ? "plant has" : "plants have"} no watering history yet.
            </p>
          )}
        </div>
      )}
    </AnalyticsCard>
  );
}

export function WateringHabitsCard({ habits, loading }: { habits: WateringHabits; loading: boolean }) {
  const hasHabits = habits.late.length + habits.early.length + habits.irregular.length > 0;

  return (
    <AnalyticsCard
      title="Watering habits"
      description="How your timing compares to each schedule, last 90 days"
      icon={Target}
      iconClasses="bg-sprout-cream text-sprout-dark"
    >
      {loading ? (
        <EmptyNote>Analyzing watering history…</EmptyNote>
      ) : !hasHabits ? (
        <EmptyNote>
          {habits.consistentCount > 0
            ? "Your plants are watered on a consistent rhythm. Nice work!"
            : "Not enough watering history yet to spot habits."}
        </EmptyNote>
      ) : (
        <div className="space-y-5">
          {habits.late.length > 0 && <PlantGroup label="Runs late" dotClass="bg-sprout-warning" plants={habits.late} />}
          {habits.early.length > 0 && <PlantGroup label="Runs early" dotClass="bg-sprout-water" plants={habits.early} />}
          {habits.irregular.length > 0 && (
            <PlantGroup label="Inconsistent timing" dotClass="bg-neutral-medium" plants={habits.irregular} />
          )}
          {habits.consistentCount > 0 && (
            <p className="text-[13px] font-medium text-muted-foreground px-1">
              {habits.consistentCount} {habits.consistentCount === 1 ? "plant is" : "plants are"} right on rhythm.
            </p>
          )}
        </div>
      )}
    </AnalyticsCard>
  );
}

/* ─── Day of week ─────────────────────────────────────────────────────────── */

export function WeekdayCard({ distribution }: { distribution: TimeDistribution[] }) {
  const max = Math.max(0, ...distribution.map((d) => d.waterings));
  const busiest = max > 0 ? distribution.find((d) => d.waterings === max) : undefined;

  return (
    <AnalyticsCard
      title="Busiest days"
      description={busiest ? `You water most on ${busiest.period}s · last 90 days` : "Which days you water most · last 90 days"}
      icon={CalendarDays}
      iconClasses="bg-sprout-primary text-sprout-cream"
    >
      <ol className="grid grid-cols-7 gap-1.5 md:gap-2.5 items-end h-44">
        {distribution.map((day) => {
          const top = max > 0 && day.waterings === max;
          const height = max > 0 ? Math.max(6, (day.waterings / max) * 100) : 6;
          return (
            <li
              key={day.period}
              className="flex flex-col items-center justify-end gap-1.5 h-full min-w-0"
              aria-label={`${day.period}: ${day.waterings} ${day.waterings === 1 ? "watering" : "waterings"}`}
            >
              <span className="text-[13px] font-bold text-foreground" aria-hidden="true">
                {day.waterings}
              </span>
              <div className="w-full flex-1 flex items-end rounded-[12px] bg-field overflow-hidden" aria-hidden="true">
                <div
                  className={cn(
                    "w-full rounded-[12px] motion-safe:transition-[height] motion-safe:duration-500",
                    top ? "bg-sprout-water" : "bg-sprout-light/60"
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={cn("text-xs font-bold", top ? "text-foreground" : "text-muted-foreground")}
                aria-hidden="true"
              >
                {day.period.slice(0, 3)}
              </span>
            </li>
          );
        })}
      </ol>
    </AnalyticsCard>
  );
}

/* ─── Fertilization ───────────────────────────────────────────────────────── */

function fedLabel(days: number | null) {
  if (days === null) return "never fed";
  if (days === 0) return "fed today";
  return `fed ${days}d ago`;
}

export function FertilizationCard({ summaries }: { summaries: FertilizationSummary[] }) {
  const growing = summaries.length > 0 && summaries[0].isGrowingSeason;
  // Plants that need feeding first, then the soonest due
  const sorted = [...summaries].sort(
    (a, b) => Number(b.isDue) - Number(a.isDue) || (a.daysUntilDue ?? Infinity) - (b.daysUntilDue ?? Infinity)
  );

  return (
    <AnalyticsCard
      title="Fertilizing"
      description={growing ? "Growing season, time to feed your plants" : "Dormant season, no feeding needed"}
      icon={FlaskConical}
      iconClasses="bg-sprout-success text-sprout-dark"
    >
      {growing ? (
        <ul className="space-y-2">
          {sorted.map((plant) => (
            <li key={plant.plantId}>
              <Link
                to={`/my-plants/${plant.plantId}`}
                className="flex items-center gap-3 p-2.5 rounded-[20px] bg-field hover:bg-field/70"
              >
                <div className="w-11 h-11 shrink-0 rounded-2xl overflow-hidden bg-card">
                  <PlantImage src={getPlantImageUrl(plant.plantImage, plant.plantType, PLANT_FALLBACK_IMAGE)} alt="" className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-foreground truncate">{plant.plantName}</div>
                  <div className="text-[13px] text-muted-foreground truncate">
                    {capitalize(plant.frequencyLabel.toLowerCase())}
                    {plant.fertilizerType && ` · ${capitalize(plant.fertilizerType.toLowerCase())}`} · {fedLabel(plant.daysSinceLastFertilized)}
                  </div>
                </div>
                {plant.isDue ? (
                  <span className="shrink-0 text-xs font-bold px-2.5 py-[5px] rounded-full bg-sprout-cream text-sprout-dark">
                    Due now
                  </span>
                ) : plant.daysUntilDue !== null ? (
                  <span className="shrink-0 text-xs font-bold px-2.5 py-[5px] rounded-full bg-card text-foreground">
                    In {plant.daysUntilDue}d
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote>Plants are resting for the season. Resume fertilizing in spring.</EmptyNote>
      )}
    </AnalyticsCard>
  );
}

/* ─── Seasonal schedules ──────────────────────────────────────────────────── */

const SEASONS = ["spring", "summer", "fall", "winter"] as const;
type Season = (typeof SEASONS)[number];

function currentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

export interface SeasonalRow {
  plantId: string;
  nickname: string;
  seasons: Record<Season, number | null>;
}

/** Groups this year's seasonal schedule rows by plant */
export function groupSeasonalSchedules(schedules: SeasonalScheduleRow[]): SeasonalRow[] {
  const year = new Date().getFullYear();
  const byPlant = new Map<string, SeasonalRow>();
  for (const s of schedules) {
    if (s.year !== year || !s.plant_id) continue;
    const nickname = s.user_plants?.nickname ?? "Unknown";
    if (!byPlant.has(s.plant_id)) {
      byPlant.set(s.plant_id, {
        plantId: s.plant_id,
        nickname,
        seasons: { spring: null, summer: null, fall: null, winter: null },
      });
    }
    byPlant.get(s.plant_id)!.seasons[s.season as Season] = s.watering_days;
  }
  return [...byPlant.values()];
}

export function SeasonalCard({ rows }: { rows: SeasonalRow[] }) {
  const now = currentSeason();

  return (
    <AnalyticsCard
      title="Seasonal schedules"
      description="How often each plant gets water through the year"
      icon={CalendarRange}
      iconClasses="bg-field text-foreground"
    >
      {rows.length === 0 ? (
        <EmptyNote>Seasonal schedules will appear here as the seasons change.</EmptyNote>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full border-separate border-spacing-y-1.5 -mt-1.5">
            <thead>
              <tr>
                <th className="text-left px-3 pb-1 text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">
                  Plant
                </th>
                {SEASONS.map((s) => (
                  <th key={s} className="px-0.5 sm:px-1 pb-1 text-center">
                    <span
                      className={cn(
                        "inline-block text-xs font-bold capitalize px-2 sm:px-2.5 py-1 rounded-full",
                        s === now ? "bg-sprout-cream text-sprout-dark" : "text-muted-foreground"
                      )}
                    >
                      {s}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.plantId} className="bg-field">
                  <td className="rounded-l-[16px] py-3 px-3 text-sm sm:text-[15px] font-bold text-foreground">
                    <Link to={`/my-plants/${row.plantId}`} className="hover:underline underline-offset-2">
                      {row.nickname}
                    </Link>
                  </td>
                  {SEASONS.map((s, i) => (
                    <td
                      key={s}
                      className={cn(
                        "py-3 px-0.5 sm:px-1 text-center text-sm",
                        i === SEASONS.length - 1 && "rounded-r-[16px]",
                        s === now ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                      )}
                    >
                      {row.seasons[s] !== null ? `${row.seasons[s]}d` : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AnalyticsCard>
  );
}

/* ─── Plant performance ───────────────────────────────────────────────────── */

const PATTERN_PILL: Record<PlantPerformance["pattern"], { label: string; classes: string }> = {
  consistent: { label: "Consistent", classes: "bg-sprout-success text-sprout-dark" },
  early: { label: "Early", classes: "bg-sprout-water text-sprout-dark" },
  late: { label: "Late", classes: "bg-sprout-warning text-sprout-dark" },
  irregular: { label: "Irregular", classes: "bg-card text-foreground" },
  insufficient: { label: "New", classes: "bg-card text-muted-foreground" },
};

function scoreClasses(score: number) {
  if (score >= 75) return "bg-sprout-success text-sprout-dark";
  if (score >= 50) return "bg-sprout-cream text-sprout-dark";
  return "bg-sprout-warning text-sprout-dark";
}

export function PerformanceCard({ plants, loading }: { plants: PlantPerformance[]; loading: boolean }) {
  return (
    <AnalyticsCard
      title="Plant performance"
      description="Care scores from how consistently each plant was watered, last 90 days"
      icon={Award}
      iconClasses="bg-sprout-success text-sprout-dark"
      testId="analytics-performance-card"
    >
      {loading ? (
        <EmptyNote>Analyzing watering history…</EmptyNote>
      ) : plants.length === 0 ? (
        <EmptyNote>Add a plant and log a few waterings to see how it's doing.</EmptyNote>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {plants.slice(0, 10).map((plant) => (
            <li key={plant.plantId}>
              <PerformanceRow plant={plant} />
            </li>
          ))}
        </ul>
      )}
    </AnalyticsCard>
  );
}

function PerformanceRow({ plant }: { plant: PlantPerformance }) {
  const pattern = PATTERN_PILL[plant.pattern];
  const mood = plant.moodSummary ? getMoodConfig(plant.moodSummary.dominantMood as PlantMood) : null;
  const trend = plant.moodSummary
    ? plant.moodSummary.trend === "improving"
      ? "↑"
      : plant.moodSummary.trend === "declining"
        ? "↓"
        : "→"
    : null;
  const fit = plant.scheduleFit;

  return (
    <Link
      to={`/my-plants/${plant.plantId}`}
      className="flex gap-3 p-3 rounded-[22px] bg-field hover:bg-field/70 h-full"
    >
      <div className="w-12 h-12 shrink-0 rounded-2xl overflow-hidden bg-card">
        <PlantImage src={getPlantImageUrl(plant.plantImage, plant.plantType, PLANT_FALLBACK_IMAGE)} alt="" className="w-full h-full" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-base font-bold text-foreground truncate">{plant.plantName}</div>
            <div className="text-[13px] text-muted-foreground truncate">{plant.plantType}</div>
          </div>
          {plant.careScore === -1 ? (
            <span
              className="shrink-0 font-display text-sm font-bold px-2.5 py-1 rounded-full bg-card text-muted-foreground"
              title="Not enough history for a score yet"
            >
              --
            </span>
          ) : (
            <span
              className={cn("shrink-0 font-display text-sm font-bold px-2.5 py-1 rounded-full", scoreClasses(plant.careScore))}
              title="Based on how consistently you water relative to the schedule over the last 90 days"
              aria-label={`Care score ${plant.careScore}%`}
            >
              {plant.careScore}%
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", pattern.classes)}>{pattern.label}</span>
          {fit.verdict !== "unknown" && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-card text-foreground"
              title={fit.suggestion ?? "Schedule matches your watering rhythm"}
            >
              {fit.verdict === "good"
                ? "Schedule fits"
                : `Every ~${Math.round(plant.avgInterval)}d vs ${plant.scheduleDays}d`}
            </span>
          )}
          {plant.moodSummary && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-card text-foreground"
              title={`Based on ${plant.moodSummary.totalEntries} journal entries (90 days)`}
            >
              {mood?.icon ?? "😐"} {mood?.label ?? plant.moodSummary.dominantMood} {trend}
            </span>
          )}
          {plant.postponementCount > 0 && (
            <span
              className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full",
                plant.postponementCount >= 3 ? "bg-sprout-warning text-sprout-dark" : "bg-card text-foreground"
              )}
            >
              {plant.postponementCount} {plant.postponementCount === 1 ? "postponement" : "postponements"}
            </span>
          )}
        </div>

        {plant.tip && <p className="text-[13px] leading-relaxed text-muted-foreground mt-2 text-pretty">{plant.tip}</p>}
      </div>
    </Link>
  );
}
