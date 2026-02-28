import type { WateringFactors } from "@/utils/watering/smartSchedule";

export interface WizardStepProps {
  factors: Partial<WateringFactors>;
  updateFactor: <K extends keyof WateringFactors>(
    key: K,
    value: WateringFactors[K]
  ) => void;
  labels: ReturnType<typeof import("@/utils/watering/smartSchedule").getFactorLabels>;
  plantName?: string;
}
