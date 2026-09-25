import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Bell,
  CheckCircle2,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Plus,
  Search,
  Snowflake,
  Sun,
} from "lucide-react";
import PlantImage from "@/components/ui/plant-image";
import { cn } from "@/lib/utils";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";
import { getPlantImageUrl } from "@/utils/plants/images";
import { getRoomLabel } from "@/utils/rooms";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
import { celsiusToFahrenheit } from "@/utils/weather/temperature";
import { weatherMoodService, type WeatherMood } from "@/services/weatherMoodService";
import type { WeatherData } from "@/services/weatherTypes";
import type { UserPlant } from "@/hooks/useUserPlants";

const plantImage = (plant: UserPlant) =>
  getPlantImageUrl(plant.image, plant.plant_type, PLANT_FALLBACK_IMAGE);

/* ─── Header ──────────────────────────────────────────────────────────────── */

interface HomeHeaderProps {
  firstName?: string;
  unreadCount: number;
  onBellClick: () => void;
  onAddPlant: () => void;
}

export function HomeHeader({ firstName, unreadCount, onBellClick, onAddPlant }: HomeHeaderProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  return (
    <div className="flex items-center gap-3.5 flex-wrap px-1.5 lg:px-0">
      <div className="flex-1 min-w-[180px]">
        <div className="text-sm lg:text-[15px] font-medium text-muted-foreground">
          {format(new Date(), "EEEE, MMM d")}
        </div>
        <h1 className="font-display text-[28px] lg:text-[34px] font-bold tracking-[-0.04em] mt-0.5 text-foreground">
          {firstName ? `Hey ${firstName}` : "Hey there"}
        </h1>
      </div>

      {/* Search jumps to My Plants with the query applied */}
      <form
        className="hidden lg:flex h-[52px] w-[280px] rounded-[18px] bg-card items-center gap-2.5 px-4 text-muted-foreground"
        onSubmit={(e) => {
          e.preventDefault();
          const q = query.trim();
          navigate(q ? `/my-plants?q=${encodeURIComponent(q)}` : "/my-plants");
        }}
        role="search"
      >
        <Search className="w-5 h-5 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plants"
          aria-label="Search your plants"
          className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-medium text-foreground placeholder:text-muted-foreground"
        />
      </form>

      <button
        onClick={onBellClick}
        className="relative w-12 h-12 lg:w-[52px] lg:h-[52px] rounded-2xl lg:rounded-[18px] bg-card text-foreground flex items-center justify-center"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        data-testid="home-notifications-button"
      >
        <Bell className="w-[22px] h-[22px]" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-[11px] lg:top-3 lg:right-[13px] w-[9px] h-[9px] rounded-full bg-sprout-warning" />
        )}
      </button>

      <button
        onClick={onAddPlant}
        className="hidden lg:flex h-[52px] px-5 rounded-[18px] bg-sprout-cream text-sprout-dark items-center gap-2 font-bold text-[15px]"
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
        Add plant
      </button>
    </div>
  );
}

/* ─── Tiles ───────────────────────────────────────────────────────────────── */

export interface HomeWeather {
  /** User has weather turned on */
  enabled: boolean;
  /** Preferences have loaded, so `enabled` is trustworthy */
  preferencesLoaded: boolean;
  data: WeatherData | null;
  unit: "F" | "C";
  isLoading: boolean;
}

export interface HomeStreak {
  days: number;
  /** 0–1, null when there isn't enough history yet */
  onTimeRate: number | null;
  lookbackDays: number;
}

interface HomeTilesProps {
  weather: HomeWeather;
  streak: HomeStreak;
  hasPlants: boolean;
  dueCount: number;
  dueNames: string[];
  wateredToday: number;
  nextUp: { name: string; days: number } | null;
  onWaterAll: () => void;
  attention: HomeAttention;
}

const MOOD_LABEL: Record<WeatherMood["mood"], string> = {
  excellent: "Excellent",
  great: "Great",
  good: "Good",
  fair: "Fair",
  challenging: "Tough",
};

function moodIcon(animation: WeatherMood["animation"]) {
  switch (animation) {
    case "rainy":
      return CloudRain;
    case "cold":
      return Snowflake;
    case "cloudy":
      return Cloud;
    default:
      return Sun;
  }
}

const RING_CIRCUMFERENCE = 289; // 2π × r46

export function HomeTiles({
  weather,
  streak,
  hasPlants,
  dueCount,
  dueNames,
  wateredToday,
  nextUp,
  onWaterAll,
  attention,
}: HomeTilesProps) {
  return (
    // Phone: weather across the top, then the streak beside a stack of Due today + attention.
    // Tablet and up: one row of four columns — weather (2), streak (1), and the same stack (1).
    <div className="grid grid-cols-2 gap-2.5 md:gap-3.5 md:grid-cols-4 md:auto-rows-[170px]">
      <WeatherTile weather={weather} />
      <StreakTile streak={streak} hasPlants={hasPlants} />

      {/* On phones the due and overdue tiles stack in one column beside the streak ring */}
      <div className="flex flex-col gap-2.5 md:gap-3.5 md:row-span-2 min-w-0">
        <DueTile
          count={dueCount}
          dueNames={dueNames}
          wateredToday={wateredToday}
          nextUp={nextUp}
          onWaterAll={onWaterAll}
        />
        <AttentionTile attention={attention} hasPlants={hasPlants} />
      </div>
    </div>
  );
}

function WeatherTile({ weather }: { weather: HomeWeather }) {
  const mood = useMemo(
    () => (weather.data ? weatherMoodService.getWeatherMood(weather.data, weather.unit) : null),
    [weather.data, weather.unit]
  );

  const base =
    "col-span-2 md:row-span-2 rounded-tile bg-sprout-cream text-sprout-dark p-5 md:p-[26px] relative overflow-hidden min-h-[196px] flex flex-col";

  // Weather turned off: invite the user to switch it on instead of leaving a hole
  if (weather.preferencesLoaded && !weather.enabled) {
    return (
      <div className={base} data-testid="enable-weather-prompt">
        <Blob />
        <div className="relative flex items-start justify-between gap-4">
          <div className="font-display text-[26px] md:text-[32px] font-bold leading-none tracking-[-0.04em]">
            Local weather
          </div>
          <IconDisc icon={CloudSun} />
        </div>
        <div className="flex-1" />
        <p className="relative text-[15px] md:text-base font-medium mt-4 max-w-[34ch]">
          Turn on weather to get rain delays, seasonal schedule tweaks, and a daily care mood.
        </p>
        <Link
          to="/settings?tab=weather"
          className="relative self-start mt-3.5 text-xs md:text-[13px] font-bold px-3 py-2 rounded-full bg-sprout-dark text-sprout-cream"
        >
          Turn on weather
        </Link>
      </div>
    );
  }

  if (!weather.data || !mood) {
    return (
      <div className={cn(base, "animate-pulse")} aria-busy="true" data-testid="weather-mood-banner">
        <Blob />
        <div className="relative font-display text-[76px] md:text-[110px] font-extrabold leading-[0.9] tracking-[-0.05em] opacity-30">
          --°
        </div>
        <div className="flex-1" />
        <div className="relative font-display text-[19px] font-semibold">Checking the weather…</div>
      </div>
    );
  }

  const Icon = moodIcon(mood.animation);
  const temp =
    weather.unit === "F"
      ? celsiusToFahrenheit(weather.data.current_temp_celsius)
      : Math.round(weather.data.current_temp_celsius);

  return (
    <div className={base} data-testid="weather-mood-banner">
      <Blob />
      <div className="relative flex justify-between items-start">
        <div
          className="font-display text-[76px] md:text-[110px] font-extrabold leading-[0.9] md:leading-[0.88] tracking-[-0.05em]"
          aria-label={`${temp} degrees ${weather.unit === "F" ? "Fahrenheit" : "Celsius"}`}
        >
          {temp}°
        </div>
        <IconDisc icon={Icon} />
      </div>
      <div className="flex-1" />
      <div className="relative font-display text-[19px] md:text-2xl font-semibold tracking-[-0.02em] mt-3.5">
        {mood.message}
      </div>
      <div className="relative text-[15px] md:text-base font-medium mt-1.5">{mood.plantAdvice}</div>
      <div className="relative flex flex-wrap gap-1.5 mt-3.5 md:mt-4">
        <Chip filled>{MOOD_LABEL[mood.mood]}</Chip>
        <Chip>{weather.data.current_humidity_percent}% humidity</Chip>
        <Chip>
          {weather.data.upcoming_rain_probability}% {weather.data.is_snowing ? "snow" : "rain"}
        </Chip>
        <Chip className="hidden md:inline-flex">{weather.data.daylight_hours.toFixed(1)}h daylight</Chip>
      </div>
    </div>
  );
}

function Blob() {
  return (
    <div
      aria-hidden="true"
      className="absolute -right-10 -bottom-[60px] w-[220px] h-[220px] md:-right-[60px] md:-bottom-[90px] md:w-80 md:h-80 rounded-full bg-sprout-dark opacity-[0.08]"
    />
  );
}

function IconDisc({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-sprout-dark text-sprout-cream flex items-center justify-center">
      <Icon className="w-8 h-8 md:w-10 md:h-10" />
    </div>
  );
}

function Chip({
  children,
  filled,
  className,
}: {
  children: React.ReactNode;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex text-xs md:text-[13px] font-bold px-2.5 py-1.5 md:px-3 md:py-[7px] rounded-full",
        filled ? "bg-sprout-dark text-sprout-cream" : "border-[1.5px] border-sprout-dark",
        className
      )}
    >
      {children}
    </span>
  );
}

function StreakTile({ streak, hasPlants }: { streak: HomeStreak; hasPlants: boolean }) {
  const rate = streak.onTimeRate ?? 0;
  const [shown, setShown] = useState(false);
  const [count, setCount] = useState(0);
  const timers = useRef<{ interval?: ReturnType<typeof setInterval>; timeout?: ReturnType<typeof setTimeout> }>({});

  const play = () => {
    clearInterval(timers.current.interval);
    clearTimeout(timers.current.timeout);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setShown(true);
      setCount(streak.days);
      return;
    }
    setShown(false);
    setCount(0);
    timers.current.timeout = setTimeout(() => {
      setShown(true);
      // Count up in about 14 ticks whatever the size of the streak
      const step = Math.max(1, Math.ceil(streak.days / 14));
      let n = 0;
      timers.current.interval = setInterval(() => {
        n = Math.min(streak.days, n + step);
        setCount(n);
        if (n >= streak.days) clearInterval(timers.current.interval);
      }, 90);
    }, 250);
  };

  // Replay whenever the numbers change (e.g. once the records load)
  useEffect(() => {
    play();
    const t = timers.current;
    return () => {
      clearInterval(t.interval);
      clearTimeout(t.timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak.days, rate]);

  const percent = Math.round(rate * 100);

  return (
    <button
      type="button"
      onClick={play}
      className="md:row-span-2 rounded-tile bg-sprout-primary text-sprout-cream p-4 md:p-5 flex flex-col items-center justify-center gap-2 md:gap-3.5 min-h-[190px] text-center"
      aria-label={`Care streak: ${streak.days} days, ${percent}% on time. Replay animation`}
      data-testid="care-streak-tile"
    >
      <div className="relative w-28 h-28 md:w-[130px] md:h-[130px] lg:w-[150px] lg:h-[150px]">
        <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="56" cy="56" r="46" fill="none" stroke="rgba(223,196,144,.2)" strokeWidth="12" />
          <circle
            cx="56"
            cy="56"
            r="46"
            fill="none"
            stroke="#dfc490"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={shown ? RING_CIRCUMFERENCE * (1 - rate) : RING_CIRCUMFERENCE}
            className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-[1400ms] ease-[cubic-bezier(.2,.8,.2,1)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <div className="font-display text-[32px] md:text-[44px] font-extrabold leading-none">{count}</div>
          <div className="text-[11px] md:text-xs font-bold tracking-[1px] uppercase">
            {count === 1 ? "day" : "days"}
          </div>
        </div>
      </div>
      <div aria-hidden="true">
        <div className="text-sm md:text-base font-bold">
          Care streak
          <span className="md:hidden">{streak.onTimeRate !== null ? ` · ${percent}%` : ""}</span>
        </div>
        <div className="hidden md:block text-sm font-medium mt-0.5">
          {!hasPlants
            ? "Add a plant to start"
            : streak.onTimeRate !== null
              ? `${percent}% on time, last ${streak.lookbackDays} days`
              : "Builds as you water"}
        </div>
      </div>
    </button>
  );
}

function DueTile({
  count,
  dueNames,
  wateredToday,
  nextUp,
  onWaterAll,
}: {
  count: number;
  dueNames: string[];
  wateredToday: number;
  nextUp: { name: string; days: number } | null;
  onWaterAll: () => void;
}) {
  const done = count === 0;
  const names =
    dueNames.length > 2 ? `${dueNames.slice(0, 2).join(", ")} +${dueNames.length - 2}` : dueNames.join(" & ");
  const next = nextUp
    ? `${nextUp.days === 1 ? "Tomorrow" : `In ${nextUp.days} days`}: ${nextUp.name}`
    : null;

  return (
    <button
      type="button"
      onClick={onWaterAll}
      disabled={done}
      className="flex-1 min-h-[110px] rounded-tile bg-sprout-water text-sprout-dark p-4 md:p-5 flex flex-col justify-between gap-2 relative overflow-hidden text-left disabled:cursor-default"
      data-testid="water-all-tile"
      aria-label={
        done
          ? `Due today: all done. ${wateredToday > 0 ? `${wateredToday} watered today. ` : ""}${next ?? ""}`
          : `Due today: ${count} ${count === 1 ? "plant" : "plants"}, ${names}. ${count === 1 ? "Tap to water" : "Tap to water all"}`
      }
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 bg-sprout-success motion-safe:transition-[height] motion-safe:duration-[900ms] ease-[cubic-bezier(.3,.9,.3,1)]"
        style={{ height: done ? "100%" : "0%" }}
      />
      <div className="relative flex items-center justify-between gap-2" aria-hidden="true">
        <span className="text-xs font-bold tracking-[0.8px] uppercase">Due today</span>
        {done ? (
          <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 shrink-0" />
        ) : (
          <Droplets className="w-6 h-6 md:w-7 md:h-7 shrink-0" />
        )}
      </div>
      {done ? (
        <div className="relative min-w-0" aria-hidden="true">
          <div className="font-display text-[22px] md:text-[26px] font-bold leading-none tracking-[-0.03em]">
            All done
          </div>
          <div className="text-[13px] md:text-sm font-bold mt-1.5 truncate">
            {wateredToday > 0 ? `${wateredToday} watered today` : "Nothing due today"}
          </div>
          {next && <div className="text-[13px] md:text-sm font-semibold opacity-80 truncate">{next}</div>}
        </div>
      ) : (
        <div className="relative min-w-0" aria-hidden="true">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-display text-[34px] md:text-[38px] font-extrabold leading-none">{count}</span>
            <span className="text-[13px] md:text-sm font-bold truncate">{names}</span>
          </div>
          <div className="text-[13px] md:text-[15px] font-bold mt-1">
            {count === 1 ? "Tap to water" : "Tap to water all"}
          </div>
        </div>
      )}
    </button>
  );
}

export interface HomeAttention {
  mostOverdue: { plant: UserPlant; days: number } | null;
  overdueCount: number;
  /** Plants past their feeding interval during the growing season */
  readyToFeed: UserPlant[];
  /** Plants with no watering history, so no schedule yet */
  unscheduled: UserPlant[];
  /** Plants due in the next 7 days (not counting today) */
  dueThisWeek: number;
}

/**
 * Second small tile beside "Due today". Overdue plants take it when there are any; otherwise
 * it shows the next most useful thing the other tiles don't: plants ready to feed, then plants
 * with no schedule, then a quiet look at the week ahead.
 */
function AttentionTile({ attention, hasPlants }: { attention: HomeAttention; hasPlants: boolean }) {
  const { mostOverdue, overdueCount, readyToFeed, unscheduled, dueThisWeek } = attention;
  const plural = (n: number) => `${n} ${n === 1 ? "plant" : "plants"}`;
  const listed = (plants: UserPlant[]) =>
    plants.length > 2
      ? `${plants.slice(0, 2).map((p) => p.nickname).join(", ")} +${plants.length - 2}`
      : plants.map((p) => p.nickname).join(" & ");
  // One plant: go straight to it. Several: My Plants filtered to them.
  const target = (plants: UserPlant[], filter: string) =>
    plants.length === 1 ? `/my-plants/${plants[0].id}` : `/my-plants?filter=${filter}`;

  let tile: {
    to?: string;
    testId: string;
    classes: string;
    eyebrow: string;
    /** One line on phones */
    compact: string;
    /** Big line and supporting line from tablet up */
    title: string;
    detail: string;
  };

  if (!hasPlants) {
    tile = {
      testId: "attention-tile",
      classes: "bg-card text-foreground",
      eyebrow: "Getting started",
      compact: "No plants yet",
      title: "No plants yet",
      detail: "Add one to get going",
    };
  } else if (mostOverdue) {
    const { plant, days } = mostOverdue;
    const late = `${days} ${days === 1 ? "day" : "days"} late`;
    const others = overdueCount - 1;
    tile = {
      to: overdueCount > 1 ? "/my-plants?filter=overdue" : `/my-plants/${plant.id}`,
      testId: "overdue-tile",
      classes: "bg-sprout-warning text-sprout-dark",
      eyebrow: others > 0 ? `Overdue · +${others} more` : "Overdue",
      compact: `${plant.nickname} · ${late}`,
      title: plant.nickname,
      detail: plant.room ? `${late} · ${getRoomLabel(plant.room)}` : late,
    };
  } else if (readyToFeed.length > 0) {
    tile = {
      to: target(readyToFeed, "ready-to-feed"),
      testId: "attention-tile",
      classes: "bg-sprout-cream text-sprout-dark",
      eyebrow: "Ready to feed",
      compact: readyToFeed.length === 1 ? readyToFeed[0].nickname : plural(readyToFeed.length),
      title: readyToFeed.length === 1 ? readyToFeed[0].nickname : plural(readyToFeed.length),
      detail: readyToFeed.length === 1 ? "Due for fertilizer" : listed(readyToFeed),
    };
  } else if (unscheduled.length > 0) {
    tile = {
      to: target(unscheduled, "unscheduled"),
      testId: "attention-tile",
      classes: "bg-card text-foreground",
      eyebrow: "Needs a first watering",
      compact: unscheduled.length === 1 ? unscheduled[0].nickname : plural(unscheduled.length),
      title: unscheduled.length === 1 ? unscheduled[0].nickname : plural(unscheduled.length),
      detail: "Log a watering to start the schedule",
    };
  } else {
    tile = {
      to: "/my-plants?sort=next-watering",
      testId: "attention-tile",
      classes: "bg-card text-foreground",
      eyebrow: "This week",
      compact: dueThisWeek > 0 ? `${plural(dueThisWeek)} due` : "A quiet week",
      title: dueThisWeek > 0 ? plural(dueThisWeek) : "A quiet week",
      detail: dueThisWeek > 0 ? "due in the next 7 days" : "Nothing due in the next 7 days",
    };
  }

  const quiet = tile.classes.includes("bg-card");
  const body = (
    <>
      <div className={cn("text-xs font-bold tracking-[0.8px] uppercase truncate", quiet && "text-muted-foreground")}>
        {tile.eyebrow}
      </div>
      {/* Phone: one line; tablet and up: a big line and a detail line */}
      <div className="md:hidden text-[15px] font-bold mt-0.5 truncate">{tile.compact}</div>
      <div className="hidden md:block min-w-0">
        <div className="font-display text-[22px] font-bold truncate">{tile.title}</div>
        <div className={cn("text-sm font-bold truncate", quiet && "text-muted-foreground")}>{tile.detail}</div>
      </div>
    </>
  );
  const className = cn(
    "rounded-3xl md:rounded-[32px] px-4 py-3 md:p-5 flex flex-col md:justify-between md:flex-1 min-w-0",
    tile.classes
  );

  return tile.to ? (
    <Link to={tile.to} className={className} data-testid={tile.testId}>
      {body}
    </Link>
  ) : (
    <div className={className} data-testid={tile.testId}>
      {body}
    </div>
  );
}

/* ─── Up next ─────────────────────────────────────────────────────────────── */

interface UpNextListProps {
  /** Overdue and due-today plants, most overdue first */
  today: UserPlant[];
  /** Plants due in the next 7 days (not today), soonest first */
  upcoming: UserPlant[];
  onQuickWater: (plantId: string, plantName: string) => void;
  /** Most rows to show; today's plants always show, the week fills what's left */
  limit?: number;
}

/**
 * One list of what needs water, grouped by day: Today (only when something is due, with a
 * water button per plant), Tomorrow, and Later this week.
 */
export function UpNextList({ today, upcoming, onQuickWater, limit = 8 }: UpNextListProps) {
  const week = upcoming.slice(0, Math.max(0, limit - today.length));
  const daysUntil = (plant: UserPlant) => calculateWateringSchedule(plant).daysUntilWatering ?? 0;
  const tomorrow = week.filter((plant) => daysUntil(plant) === 1);
  const later = week.filter((plant) => daysUntil(plant) > 1);
  const hidden = upcoming.length - week.length;

  const groups = [
    { label: "Today", plants: today },
    { label: "Tomorrow", plants: tomorrow },
    { label: "Later this week", plants: later },
  ].filter((group) => group.plants.length > 0);

  return (
    <section data-testid="todays-tasks-card" aria-labelledby="up-next-heading">
      <div className="flex items-baseline justify-between px-1.5 md:px-1">
        <h2
          id="up-next-heading"
          className="font-display text-xl md:text-[22px] font-bold tracking-[-0.03em] text-foreground"
        >
          Up next
        </h2>
        <Link to="/my-plants?sort=next-watering" className="text-sm font-bold text-link">
          {hidden > 0 ? `See all · +${hidden}` : "See all"}
        </Link>
      </div>

      {groups.length === 0 ? (
        <div data-testid="no-tasks-message" className="mt-3 rounded-card bg-card px-5 py-5 flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-sprout-success text-sprout-dark flex items-center justify-center">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-[17px] text-foreground">A quiet week</div>
            <div className="text-sm text-muted-foreground">Nothing needs water in the next 7 days.</div>
          </div>
        </div>
      ) : (
        <div data-testid="tasks-list" className="mt-2 space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1.5 md:px-1 mb-2">
                {group.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {group.plants.map((plant) => (
                  <UpNextRow
                    key={plant.id}
                    plant={plant}
                    onQuickWater={group.label === "Today" ? onQuickWater : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function UpNextRow({
  plant,
  onQuickWater,
}: {
  plant: UserPlant;
  /** Only today's plants get a water button */
  onQuickWater?: (plantId: string, plantName: string) => void;
}) {
  const calc = calculateWateringSchedule(plant);
  const days = calc.daysUntilWatering ?? 0;

  let pill: { text: string; classes: string } | null;
  if (calc.isOverdue) {
    const late = Math.abs(days);
    pill = { text: `${late} ${late === 1 ? "day" : "days"} late`, classes: "bg-sprout-warning text-sprout-dark" };
  } else if (days === 0) {
    pill = { text: "Due today", classes: "bg-sprout-water text-sprout-dark" };
  } else if (days === 1) {
    // Already under the "Tomorrow" heading
    pill = null;
  } else {
    // A weekday reads faster than "In 4 days" once it's more than a day out
    const due = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    pill = { text: format(due, "EEE"), classes: "bg-field text-foreground" };
  }

  return (
    <div
      data-testid={`task-item-${plant.id}`}
      className="flex items-center gap-3 p-2.5 rounded-[22px] bg-card"
    >
      <Link to={`/my-plants/${plant.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-12 h-12 shrink-0 rounded-2xl overflow-hidden bg-field">
          <PlantImage src={plantImage(plant)} alt="" className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-foreground truncate">{plant.nickname}</div>
          <div className="text-[13px] text-muted-foreground truncate">{plant.plant_type}</div>
        </div>
      </Link>
      {pill && (
        <span
          className={cn("shrink-0 text-xs font-bold px-2.5 py-[5px] rounded-full", pill.classes)}
          data-testid={calc.isOverdue ? `overdue-badge-${plant.id}` : days === 0 ? `due-today-badge-${plant.id}` : undefined}
        >
          {pill.text}
        </span>
      )}
      {onQuickWater && (
        <button
          type="button"
          onClick={() => onQuickWater(plant.id, plant.nickname)}
          className={cn(
            "shrink-0 w-11 h-11 rounded-2xl text-sprout-dark flex items-center justify-center active:scale-95 transition-transform",
            calc.isOverdue ? "bg-sprout-warning" : "bg-sprout-water"
          )}
          aria-label={`Water ${plant.nickname}`}
          data-testid={`quick-water-button-${plant.id}`}
        >
          <Droplets className="w-5 h-5" strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}
