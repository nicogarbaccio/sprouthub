import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/contexts/ThemeContext";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsCard } from "./SettingsUI";

type ThemeChoice = "light" | "dark" | "system";

const THEMES: { value: ThemeChoice; label: string; description: string }[] = [
  { value: "light", label: "Light Mode", description: "Bright and clean" },
  { value: "dark", label: "Dark Mode", description: "Easy on the eyes at night" },
  { value: "system", label: "System Default", description: "Match your device" },
];

/** A tiny sketch of the app in each theme: page, sidebar, and a couple of tiles */
function ThemePreview({ theme }: { theme: ThemeChoice }) {
  const half = (mode: "light" | "dark", className?: string) => (
    <div
      className={cn(
        "flex gap-1.5 p-2 h-full",
        mode === "light" ? "bg-neutral-light" : "bg-sprout-dark",
        className
      )}
    >
      <div className={cn("w-3 rounded-md", mode === "light" ? "bg-sprout-dark" : "bg-sprout-primary")} />
      <div className="flex-1 grid grid-cols-2 gap-1.5">
        <div className="col-span-2 rounded-md bg-sprout-cream" />
        <div className={cn("rounded-md", mode === "light" ? "bg-white" : "bg-sprout-primary")} />
        <div className="rounded-md bg-sprout-water" />
      </div>
    </div>
  );

  return (
    <div className="h-24 rounded-2xl overflow-hidden" aria-hidden="true">
      {theme === "system" ? (
        <div className="relative h-full">
          {half("light")}
          <div className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">{half("dark")}</div>
        </div>
      ) : (
        half(theme)
      )}
    </div>
  );
}

export const AppearanceTab = () => {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsCard
      title="Appearance"
      description="How sprouthub looks"
      icon={Palette}
      iconClasses="bg-sprout-cream text-sprout-dark"
    >
      <RadioGroup
        value={theme}
        onValueChange={(value) => setTheme(value as ThemeChoice)}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
        aria-label="Theme"
      >
        {THEMES.map((option) => {
          const selected = theme === option.value;
          return (
            <Label
              key={option.value}
              htmlFor={option.value}
              className={cn(
                "block rounded-[22px] p-2 cursor-pointer transition-colors",
                selected ? "bg-sprout-cream text-sprout-dark" : "bg-field text-foreground"
              )}
            >
              <ThemePreview theme={option.value} />
              <div className="flex items-center gap-2.5 px-2 pt-3 pb-1.5">
                <RadioGroupItem value={option.value} id={option.value} className="border-current text-current" />
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold">{option.label}</span>
                  <span className={cn("block text-[13px] font-medium", selected ? "opacity-80" : "text-muted-foreground")}>
                    {option.description}
                  </span>
                </span>
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </SettingsCard>
  );
};
