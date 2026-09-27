import type { ReactNode } from "react";
import { CircleCheck, Droplets, PawPrint, Scissors, Shovel, Snowflake, Sun, TrendingUp } from "lucide-react";
import type { CatalogPlant } from "@/data/types";
import type { PetRating } from "@/data/catalog/schema";
import { cn } from "@/lib/utils";
import {
  directSunText,
  drynessText,
  growthRateText,
  idealLightText,
  overwaterText,
  petRatingText,
  propagationMethodText,
  repotIntervalText,
  toleratedLightText,
  winterWateringText,
} from "@/utils/plants/careText";

type GuidePlant = Pick<CatalogPlant, "name" | "care" | "whatsNormal" | "propagation" | "toxicity" | "toxicityDetail">;

interface PlantGuideProps {
  plant: GuidePlant;
  /** Repeat the one-line pet safety summary; the catalog page already shows it beside the photo */
  showPetSummary?: boolean;
}

const card = "rounded-card bg-card p-[18px] md:p-6";

function CardHeading({ icon, iconClassName, children }: { icon: ReactNode; iconClassName: string; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 font-display text-xl font-bold tracking-[-0.02em] text-foreground">
      <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconClassName)}>{icon}</span>
      {children}
    </h2>
  );
}

function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] bg-field px-4 py-3">
      <span className="text-muted-foreground mt-0.5 shrink-0" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[13px] font-semibold text-muted-foreground">{label}</dt>
        <dd className="text-[15px] text-foreground leading-snug space-y-0.5">{children}</dd>
      </div>
    </div>
  );
}

/** Watering, light, cold, growth and repotting details from the catalog's researched care data */
function CareDetails({ plant }: { plant: GuidePlant }) {
  const { watering, light, temperature, growthRate, repotting } = plant.care ?? {};
  const tolerated = light && toleratedLightText(light);
  const hasRepotting = repotting?.everyYears || repotting?.soil;
  if (!watering && !light && !temperature?.coldDamageBelowF && !growthRate && !hasRepotting) return null;

  const icon = "w-[18px] h-[18px]";
  return (
    <section className={card}>
      <CardHeading icon={<Droplets className={icon} />} iconClassName="bg-sprout-water text-sprout-dark">
        Care details
      </CardHeading>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
        {watering && (
          <DetailRow icon={<Droplets className={icon} />} label="Watering">
            <p>{drynessText(watering.dryness)}</p>
            <p className="text-muted-foreground">In winter: {winterWateringText(watering.dormantSeasonDays).toLowerCase()}</p>
          </DetailRow>
        )}
        {watering && (
          <DetailRow icon={<Droplets className={icon} />} label="Overwatering risk">
            <p>{overwaterText(watering.overwaterSensitivity)}</p>
          </DetailRow>
        )}
        {light && (
          <DetailRow icon={<Sun className={icon} />} label="Light">
            <p>Best in {idealLightText(light).toLowerCase()}</p>
            {tolerated && <p className="text-muted-foreground">Copes with {tolerated.toLowerCase()}</p>}
            <p className="text-muted-foreground">{directSunText(light.directSun)}</p>
          </DetailRow>
        )}
        {temperature?.coldDamageBelowF !== undefined && (
          <DetailRow icon={<Snowflake className={icon} />} label="Cold limit">
            <p>Keep it above {temperature.coldDamageBelowF}°F</p>
          </DetailRow>
        )}
        {growthRate && (
          <DetailRow icon={<TrendingUp className={icon} />} label="Growth">
            <p>{growthRateText(growthRate)}</p>
          </DetailRow>
        )}
        {hasRepotting && (
          <DetailRow icon={<Shovel className={icon} />} label="Repotting">
            {repotting.everyYears && <p>{repotIntervalText(repotting.everyYears)}</p>}
            {repotting.soil && <p className={cn(repotting.everyYears && "text-muted-foreground")}>{repotting.soil}</p>}
          </DetailRow>
        )}
      </dl>
    </section>
  );
}

function WhatsNormal({ plant }: { plant: GuidePlant }) {
  if (!plant.whatsNormal?.length) return null;
  return (
    <section className={card}>
      <CardHeading icon={<CircleCheck className="w-[18px] h-[18px]" />} iconClassName="bg-sprout-success text-sprout-dark">
        What's normal
      </CardHeading>
      <p className="text-sm text-muted-foreground mt-1">Things that can look like problems but usually aren't.</p>
      <ul className="space-y-2.5 mt-4">
        {plant.whatsNormal.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[15px] text-foreground leading-snug">
            <span className="w-1.5 h-1.5 rounded-full bg-sprout-light mt-2 shrink-0" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Propagation({ plant }: { plant: GuidePlant }) {
  if (!plant.propagation) return null;
  const { methods, tip } = plant.propagation;
  return (
    <section className={card}>
      <CardHeading icon={<Scissors className="w-[18px] h-[18px]" />} iconClassName="bg-sprout-cream text-sprout-dark">
        Propagation
      </CardHeading>
      <ul className="flex flex-wrap gap-1.5 mt-4" aria-label="Propagation methods">
        {methods.map((method) => (
          <li key={method} className="text-xs font-bold px-2.5 py-[5px] rounded-full bg-field text-foreground">
            {propagationMethodText(method)}
          </li>
        ))}
      </ul>
      <p className="text-[15px] text-foreground leading-snug mt-3">{tip}</p>
    </section>
  );
}

const RATING_CLASSES: Record<PetRating, string> = {
  toxic: "bg-sprout-warning text-sprout-dark",
  non_toxic: "bg-sprout-success text-sprout-dark",
  unknown: "bg-field text-foreground",
};

const SEVERITY_TEXT = { mild: "Usually mild", moderate: "Can be moderate", severe: "Can be severe" } as const;

function PetSafety({ plant, showSummary }: { plant: GuidePlant; showSummary: boolean }) {
  const detail = plant.toxicityDetail;
  if (!detail) return null;
  const animals = [
    ["Cats", detail.cats],
    ["Dogs", detail.dogs],
    ["Horses", detail.horses],
  ] as const;
  const isToxic = animals.some(([, rating]) => rating === "toxic");

  return (
    <section className={card}>
      <CardHeading icon={<PawPrint className="w-[18px] h-[18px]" />} iconClassName="bg-sprout-cream text-sprout-dark">
        Pet safety
      </CardHeading>
      {showSummary && plant.toxicity && <p className="text-[15px] text-foreground leading-snug mt-3">{plant.toxicity}</p>}
      <ul className="grid grid-cols-3 gap-2 mt-4" aria-label="Pet safety by animal">
        {animals.map(([animal, rating]) => (
          <li key={animal} className={cn("rounded-[18px] px-3 py-2.5 text-center", RATING_CLASSES[rating])}>
            <span className="block text-[13px] font-semibold">{animal}</span>
            <span className="block text-[15px] font-bold">{petRatingText(rating)}</span>
          </li>
        ))}
      </ul>
      {detail.symptoms.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] font-semibold text-muted-foreground">
            Signs to watch for{detail.severity ? ` · ${SEVERITY_TEXT[detail.severity]}` : ""}
          </p>
          <ul className="flex flex-wrap gap-1.5 mt-2">
            {detail.symptoms.map((symptom) => (
              <li key={symptom} className="text-xs font-bold px-2.5 py-[5px] rounded-full bg-field text-foreground">
                {symptom}
              </li>
            ))}
          </ul>
        </div>
      )}
      {isToxic && (
        <p className="text-sm text-muted-foreground leading-relaxed mt-4">
          If a pet eats it, call your vet or the ASPCA Animal Poison Control Center at{" "}
          <a href="tel:+18884264435" className="font-semibold text-foreground underline underline-offset-2">
            (888) 426-4435
          </a>
          .
        </p>
      )}
    </section>
  );
}

/** Researched care knowledge for a catalog plant. Sections without data are left out. */
const PlantGuide = ({ plant, showPetSummary = false }: PlantGuideProps) => {
  const hasNormal = Boolean(plant.whatsNormal?.length);
  const hasPropagation = Boolean(plant.propagation);
  return (
    <div className="space-y-2.5 md:space-y-3.5">
      <CareDetails plant={plant} />
      {(hasNormal || hasPropagation) && (
        // Side by side only when both exist, so a lone card isn't stuck at half width
        <div className={cn("grid grid-cols-1 gap-2.5 md:gap-3.5 items-start", hasNormal && hasPropagation && "md:grid-cols-2")}>
          <WhatsNormal plant={plant} />
          <Propagation plant={plant} />
        </div>
      )}
      <PetSafety plant={plant} showSummary={showPetSummary} />
    </div>
  );
};

export default PlantGuide;
