import { Plus, LogIn, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlantInfoSectionProps {
  name: string;
  botanicalName: string;
  otherNames?: string[];
  description: string;
  careLevel: string;
  toxicity: string;
  onAddToCollection: () => void;
  isAuthenticated?: boolean;
  onSignInToAdd?: () => void;
}

const CARE_LEVEL_CLASSES: Record<string, string> = {
  Easy: "bg-sprout-success text-sprout-dark",
  Medium: "bg-sprout-cream text-sprout-dark",
  Hard: "bg-sprout-warning text-sprout-dark",
};

const PlantInfoSection = ({
  name,
  botanicalName,
  otherNames,
  description,
  careLevel,
  toxicity,
  onAddToCollection,
  isAuthenticated = false,
  onSignInToAdd,
}: PlantInfoSectionProps) => {
  const ActionIcon = isAuthenticated ? Plus : LogIn;

  return (
    <div className="px-[22px] md:px-2 lg:px-0 pt-5 lg:pt-2 flex flex-col gap-4">
      <div>
        <span
          className={cn(
            "inline-flex text-xs font-bold px-2.5 py-[5px] rounded-full",
            CARE_LEVEL_CLASSES[careLevel] ?? "bg-card text-foreground"
          )}
        >
          {careLevel} care
        </span>
        <h1
          className="font-display text-4xl md:text-5xl font-extrabold tracking-[-0.04em] mt-2.5 text-foreground break-words"
          data-testid="plant-name"
        >
          {name}
        </h1>
        <p className="text-base font-medium text-muted-foreground italic" data-testid="botanical-name">
          {botanicalName}
        </p>
        {otherNames && otherNames.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold">Also known as:</span> {otherNames.join(", ")}
          </p>
        )}
      </div>

      <p className="rounded-card bg-card p-[18px] text-[15px] leading-relaxed text-foreground">{description}</p>

      <div className="rounded-card bg-sprout-cream text-sprout-dark p-[18px] flex items-start gap-3">
        <PawPrint className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-[15px] font-medium">
          <span className="font-bold">Pet safety:</span> {toxicity}
        </p>
      </div>

      <button
        type="button"
        onClick={isAuthenticated ? onAddToCollection : onSignInToAdd}
        className="w-full h-16 rounded-3xl bg-sprout-dark text-sprout-cream flex items-center justify-center gap-2.5 font-display font-bold text-base shadow-[inset_0_0_0_2px_#dfc490]"
        data-testid={isAuthenticated ? "add-to-collection-button" : "sign-in-to-add-button"}
      >
        <ActionIcon className="w-5 h-5" strokeWidth={2.5} />
        {isAuthenticated ? "Add to My Collection" : "Sign in to Add to Collection"}
      </button>
    </div>
  );
};

export default PlantInfoSection;
