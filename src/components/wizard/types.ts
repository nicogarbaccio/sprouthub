import type { WateringFactors } from "@/utils/smartWateringSchedule";

export interface WizardStepProps {
  factors: Partial<WateringFactors>;
  updateFactor: <K extends keyof WateringFactors>(
    key: K,
    value: WateringFactors[K]
  ) => void;
  labels: ReturnType<typeof import("@/utils/smartWateringSchedule").getFactorLabels>;
  plantName?: string;
}
