import { format } from "date-fns";
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  Droplets,
  Lightbulb,
  Plus,
  Sun,
} from "lucide-react";
import PlantImage from "@/components/ui/plant-image";
import { WateredBurst } from "@/components/ui/watered-burst";
import { useJustWatered } from "@/hooks/useJustWatered";
import { cn } from "@/lib/utils";
import { getRoomLabel } from "@/utils/rooms";
import type { UserPlant } from "@/hooks/useUserPlants";
import type { CatalogPlant } from "@/data/types";
import type { WateringCalculation } from "@/utils/watering/schedule";
import type { WateringStatus } from "@/utils/watering/status";
import type { OverwateringRisk } from "@/utils/plants/overwatering";
import type { WateringPatternAnalysis } from "@/types/wateringPatternTypes";
import type { FertilizationAdvice, FertilizationStatus } from "@/utils/plants/fertilizationAdvice";
import type { JournalPreview } from "@/hooks/usePlantJournalPreview";
import type { BadgeInfo } from "./usePlantStatusInfo";

/* ─── Hero ────────────────────────────────────────────────────────────────── */

interface PlantHeroProps {
  plant: UserPlant;
  catalogPlant?: CatalogPlant;
  imageSrc: string;
  overwatering?: OverwateringRisk;
  onBack: () => void;
  onImageClick: () => void;
  /** The ⋯ actions menu, rendered in the top-right corner */
  actions: React.ReactNode;
}

export function PlantHero({
  plant,
  catalogPlant,
  imageSrc,
  overwatering,
  onBack,
  onImageClick,
  actions,
}: PlantHeroProps) {
  const alsoKnownAs =
    plant.alternative_names?.length > 0 ? plant.alternative_names : catalogPlant?.otherNames;

  return (
    <>
      <div className="relative h-[340px] md:h-[400px] rounded-b-[40px] md:rounded-[40px] overflow-hidden bg-field">
        <button
          type="button"
          onClick={onImageClick}
          className="absolute inset-0 w-full h-full"
          aria-label={`View ${plant.nickname} image in fullscreen`}
        >
          <PlantImage src={imageSrc} alt={plant.nickname} className="w-full h-full" />
        </button>
        <div className="absolute top-3.5 inset-x-6 flex justify-between pointer-events-none">
          <button
            type="button"
            onClick={onBack}
            className="pointer-events-auto w-12 h-12 rounded-2xl bg-card text-foreground flex items-center justify-center shadow-sm"
            aria-label="Back"
          >
            <ChevronLeft className="w-[22px] h-[22px]" strokeWidth={2.2} />
          </button>
          <div className="pointer-events-auto">{actions}</div>
        </div>
        {overwatering && overwatering.level !== "none" && (
          <span
            className={cn(
              "absolute left-6 bottom-5 px-3 py-1.5 rounded-full text-xs font-bold text-sprout-dark",
              overwatering.level === "high" ? "bg-sprout-warning" : "bg-sprout-cream"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            {overwatering.level === "high" ? "Overwatering risk" : "Watch watering"}
          </span>
        )}
      </div>

      <div className="px-[22px] md:px-2 pt-5">
        <div className="flex flex-wrap gap-1.5">
          {plant.room && <HeroChip>{getRoomLabel(plant.room)}</HeroChip>}
          {catalogPlant?.careLevel && <HeroChip>{catalogPlant.careLevel} care</HeroChip>}
          {plant.is_outdoor_plant && <HeroChip>Outdoor</HeroChip>}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-[-0.04em] mt-2.5 text-foreground break-words">
          {plant.nickname}
        </h1>
        <p className="text-base font-medium text-muted-foreground">
          {catalogPlant?.botanicalName || plant.plant_type}
        </p>
        {alsoKnownAs && alsoKnownAs.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold">Also known as:</span> {alsoKnownAs.join(", ")}
          </p>
        )}
      </div>
    </>
  );
}

function HeroChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold px-2.5 py-[5px] rounded-full bg-card text-foreground">
      {children}
    </span>
  );
}

/* ─── Care tiles ──────────────────────────────────────────────────────────── */

interface PlantCareTilesProps {
  plant: UserPlant;
  calc: WateringCalculation;
  status: WateringStatus;
  lightRequirement: string;
  humidity: string;
  temperature: string;
  fertilization: { advice: FertilizationAdvice; status: FertilizationStatus };
  analysis: WateringPatternAnalysis | null;
  smartTips: BadgeInfo | null;
  /** Undefined while loading */
  journal?: JournalPreview;
  onWaterClick: () => void;
  onFertilizeClick: () => void;
  onSmartTipsClick: () => void;
  onHistoryClick: () => void;
  onJournalClick: () => void;
  onNewJournalEntry: () => void;
}

const PATTERN_COPY: Record<WateringPatternAnalysis["pattern"], string> = {
  consistent: "Right on schedule",
  late: "Running a little late",
  early: "Watering a bit early",
  irregular: "A bit irregular lately",
};

export function PlantCareTiles({
  plant,
  calc,
  status,
  lightRequirement,
  humidity,
  temperature,
  fertilization,
  analysis,
  smartTips,
  journal,
  onWaterClick,
  onFertilizeClick,
  onSmartTipsClick,
  onHistoryClick,
  onJournalClick,
  onNewJournalEntry,
}: PlantCareTilesProps) {
  const schedule = plant.suggested_watering_days || 7;
  const justWatered = status.text === "Watered today";
  const playWateredBurst = useJustWatered(plant.id);
  const tileIsWaterBlue = !justWatered && !calc.isOverdue && status.tone === "due";
  const waterTone = justWatered
    ? "bg-sprout-success text-sprout-dark"
    : calc.isOverdue
      ? "bg-sprout-warning text-sprout-dark"
      : tileIsWaterBlue
        ? "bg-sprout-water text-sprout-dark"
        : "bg-card text-foreground";
  // Water blue like the other water buttons, inverted when the tile itself is already blue
  const waterButtonTone = tileIsWaterBlue
    ? "bg-sprout-dark text-sprout-water hover:bg-sprout-dark/85"
    : "bg-sprout-water text-sprout-dark hover:brightness-110";

  const lastWatered = plant.latest_watering
    ? `last ${format(new Date(plant.latest_watering), "MMM d")}`
    : "never watered";

  // "65-75°F (18-24°C)" reads best as its first half on a tile
  const tempHeadline = temperature.split(" (")[0];

  const hasPattern =
    analysis && !(analysis.confidence === "low" && analysis.reasoning.some((r) => r.includes("Need at least")));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 px-4 md:px-0 pt-[18px]">
      {/* Watering */}
      <div className={cn("relative col-span-2 md:col-span-4 rounded-tile p-[18px] md:p-6 flex items-center gap-3.5", waterTone)}>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold tracking-[0.8px] uppercase opacity-90">Watering</div>
          <div
            key={status.text}
            className={cn(
              "font-display text-2xl md:text-[28px] font-bold tracking-[-0.03em] mt-1",
              playWateredBurst && "watered-pop origin-left"
            )}
            data-testid="plant-watering-status"
          >
            {status.text}
          </div>
          <div className="text-sm font-semibold mt-0.5">
            Every {schedule} {schedule === 1 ? "day" : "days"} · {lastWatered}
          </div>
        </div>
        <button
          type="button"
          onClick={onWaterClick}
          className={cn(
            "shrink-0 h-[60px] px-5 rounded-[22px] flex items-center gap-2 font-bold text-[15px] shadow-sm transition-[background-color,filter,transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sprout-dark focus-visible:ring-offset-2",
            waterButtonTone
          )}
          data-testid="plant-water-button"
        >
          <Droplets className="w-5 h-5" />
          Water
        </button>

        {playWateredBurst && <WateredBurst />}
      </div>

      <InfoTile
        className="bg-sprout-cream text-sprout-dark"
        top={<Sun className="w-6 h-6" />}
        label="Light"
        value={lightRequirement}
      />
      <InfoTile
        className="bg-sprout-water text-sprout-dark"
        top={<div className="font-display text-[22px] md:text-[28px] font-extrabold leading-none tracking-[-0.03em] whitespace-nowrap">{humidityHeadline(humidity)}</div>}
        label="Humidity"
        value={humidityCopy(humidity)}
      />
      <InfoTile
        className="bg-card text-foreground"
        top={<div className="font-display text-xl md:text-2xl font-extrabold leading-none tracking-[-0.03em] whitespace-nowrap">{tempHeadline}</div>}
        label="Temperature"
        labelClassName="text-muted-foreground"
        value="Room temp"
      />
      <button
        type="button"
        onClick={onFertilizeClick}
        className="rounded-card bg-sprout-primary text-sprout-cream p-4 min-h-[120px] flex flex-col justify-between text-left"
      >
        <span
          className={cn(
            "self-start text-xs font-bold px-[9px] py-1 rounded-full",
            fertilization.status.isDue ? "bg-sprout-success text-sprout-dark" : "bg-sprout-cream/20"
          )}
        >
          {fertilization.status.isDue ? "Due now" : fertilizedLabel(fertilization.status.daysSinceLastFertilized)}
        </span>
        <div>
          <div className="text-[13px] font-semibold">Fertilize</div>
          <div className="text-[17px] font-bold leading-snug first-letter:uppercase">
            {fertilization.advice.frequencyLabel}
          </div>
        </div>
      </button>

      {/* Watering pattern */}
      <div className="col-span-2 rounded-card bg-card p-[18px]">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">Watering pattern</div>
          <button type="button" onClick={onHistoryClick} className="text-sm font-bold text-link">
            History
          </button>
        </div>
        <div className="font-display text-xl font-bold tracking-[-0.02em] mt-2 text-foreground">
          {hasPattern ? PATTERN_COPY[analysis!.pattern] : "Learning your rhythm"}
        </div>
        <p className="text-[15px] leading-relaxed mt-1.5 text-muted-foreground text-pretty">
          {hasPattern
            ? analysis!.reasoning[0]
            : `Log a few more waterings and we'll learn how ${plant.nickname} likes it.`}
        </p>
        {smartTips && (
          <button
            type="button"
            onClick={onSmartTipsClick}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-sprout-cream text-sprout-dark"
            aria-label={smartTips.description}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {smartTips.text}
          </button>
        )}
      </div>

      <JournalTile
        plantName={plant.nickname}
        journal={journal}
        onOpen={onJournalClick}
        onNewEntry={onNewJournalEntry}
      />
    </div>
  );
}

/* ─── Journal ─────────────────────────────────────────────────────────────── */

function JournalTile({
  plantName,
  journal,
  onOpen,
  onNewEntry,
}: {
  plantName: string;
  journal?: JournalPreview;
  onOpen: () => void;
  onNewEntry: () => void;
}) {
  const latestNote = journal?.latestNote ?? null;
  const entryCount = journal?.entryCount ?? 0;
  const photos = journal?.photos ?? [];

  return (
    <div
      className="col-span-2 rounded-card bg-sprout-cream text-sprout-dark p-[18px] md:p-5 flex flex-col gap-4"
      data-testid="plant-journal-tile"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-dark text-sprout-cream flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold tracking-[0.8px] uppercase">Plant journal</div>
          <div className="text-[13px] font-semibold opacity-75">
            {entryCount > 0 ? `${entryCount} ${entryCount === 1 ? "entry" : "entries"}` : "No entries yet"}
          </div>
        </div>
        {entryCount > 0 && (
          <button
            type="button"
            onClick={onOpen}
            className="text-sm font-bold rounded-full px-3 py-1.5 hover:bg-sprout-dark/10 transition-colors"
          >
            Open
          </button>
        )}
      </div>

      {latestNote ? (
        <button type="button" onClick={onOpen} className="group text-left -mt-1">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-display text-xl font-bold tracking-[-0.02em] truncate group-hover:underline underline-offset-4 decoration-2">
              {latestNote.title || "Untitled note"}
            </div>
            {latestNote.entry_date && (
              <div className="shrink-0 text-xs font-bold opacity-70">
                {format(new Date(latestNote.entry_date), "MMM d")}
              </div>
            )}
          </div>
          {latestNote.content && (
            <p className="text-[15px] leading-relaxed mt-1 line-clamp-2 text-pretty">{latestNote.content}</p>
          )}
        </button>
      ) : entryCount > 0 ? (
        // Only the automatic watering/fertilizing log so far
        <div className="-mt-1">
          <div className="font-display text-xl font-bold tracking-[-0.02em]">Add your own notes</div>
          <p className="text-[15px] leading-relaxed mt-1 opacity-80 text-pretty">
            Waterings and feedings are logged here for you. Jot down new leaves, a repot or a pest
            scare, and add photos to watch {plantName} grow.
          </p>
        </div>
      ) : (
        <div className="-mt-1">
          <div className="font-display text-xl font-bold tracking-[-0.02em]">Start {plantName}'s story</div>
          <p className="text-[15px] leading-relaxed mt-1 opacity-80 text-pretty">
            Note new leaves, a repot or a pest scare, and add photos to watch it grow.
          </p>
        </div>
      )}

      {photos.length > 0 && (
        <button type="button" onClick={onOpen} className="flex gap-2" aria-label="Open journal photos">
          {photos.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              loading="lazy"
              className="w-16 h-16 md:w-20 md:h-20 rounded-[14px] object-cover bg-sprout-dark/10"
            />
          ))}
        </button>
      )}

      <button
        type="button"
        onClick={onNewEntry}
        className="self-start h-12 px-4 rounded-[18px] bg-sprout-dark text-sprout-cream inline-flex items-center gap-2 font-bold text-[15px] transition-[background-color,transform] hover:bg-sprout-dark/90 active:scale-95"
        data-testid="plant-journal-new-entry"
      >
        <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
        {latestNote ? "New entry" : entryCount > 0 ? "Add a note" : "Write the first note"}
      </button>
    </div>
  );
}

function InfoTile({
  className,
  top,
  label,
  value,
  labelClassName,
}: {
  className: string;
  top: React.ReactNode;
  label: string;
  value: string;
  labelClassName?: string;
}) {
  return (
    <div className={cn("rounded-card p-4 min-h-[120px] flex flex-col justify-between gap-2", className)}>
      {top}
      <div>
        <div className={cn("text-[13px] font-semibold", labelClassName)}>{label}</div>
        <div className="text-[17px] font-bold leading-snug">{value}</div>
      </div>
    </div>
  );
}

/**
 * The number part of a humidity note for a tile headline, e.g. "30-50% - tolerates dry air"
 * → "30-50%". The full note can be long enough to push a tile off the screen.
 */
export function humidityHeadline(humidity: string): string {
  return humidity.match(/^[\d\s–-]+%/)?.[0].trim() ?? humidity;
}

/** Plain-words caption for a humidity range, e.g. "40-60%" → "Average home air" */
export function humidityCopy(humidity: string): string {
  const lowest = parseInt(humidity, 10);
  if (Number.isNaN(lowest)) return "Average";
  if (lowest >= 60) return "Loves it moist";
  if (lowest >= 40) return "Average home air";
  return "Fine with dry air";
}

function fertilizedLabel(days: number | null): string {
  if (days === null) return "Not logged";
  if (days === 0) return "Fed today";
  return `Fed ${days}d ago`;
}
