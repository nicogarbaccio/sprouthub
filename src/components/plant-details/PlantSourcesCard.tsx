import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen } from "lucide-react";
import type { CatalogPlant } from "@/data/types";

interface PlantSourcesCardProps {
  plant: Pick<CatalogPlant, "name" | "sources" | "review">;
}

/** Where a catalog plant's care and pet-safety info comes from, linking to the full explanation */
const PlantSourcesCard = ({ plant }: PlantSourcesCardProps) => {
  const sources = plant.sources ?? [];
  // Legacy entries only have their pet safety researched so far
  const researched = plant.review?.status !== "legacy";

  return (
    <section className="rounded-card bg-card p-[18px] md:p-6">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-bold tracking-[-0.02em] text-foreground">
        <span className="w-9 h-9 rounded-xl bg-sprout-cream text-sprout-dark flex items-center justify-center">
          <BookOpen className="w-[18px] h-[18px]" />
        </span>
        Sources
      </h2>

      {sources.length > 0 && (
        <>
          <p className="text-[15px] text-muted-foreground mt-3">
            {researched
              ? `Care and pet-safety info for ${plant.name} comes from:`
              : `Pet-safety info for ${plant.name} comes from:`}
          </p>
          <ul className="mt-2 space-y-1.5">
            {sources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-semibold text-foreground underline underline-offset-2 decoration-foreground/30 hover:decoration-foreground"
                >
                  {source.title}
                  <ArrowUpRight className="inline w-4 h-4 ml-0.5 align-[-2px]" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="text-sm text-muted-foreground leading-relaxed mt-3">
        {researched
          ? "Where sources are vague — like how much less to water in winter — we fill in estimates based on them."
          : "We're still checking the rest of this plant's care guide against trusted sources."}{" "}
        <Link to="/about#plant-data" className="font-semibold text-foreground underline underline-offset-2">
          How we source plant info
        </Link>
      </p>
    </section>
  );
};

export default PlantSourcesCard;
