import { useCallback } from "react";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
import { getWateringStatus } from "@/utils/watering/status";
import type { UserPlant } from "@/hooks/useUserPlants";
import type { PatternInsight } from "@/types/wateringPatternTypes";

export interface StatusInfo {
  color: string;
  text: string;
}

export interface BadgeInfo {
  text: string;
  description: string;
}

/**
 * Watering status for the plant detail page.
 *
 * Delegates to the canonical formatter so the detail page and the plant cards can never
 * disagree about the same plant.
 */
export function useStatusInfo(plant: UserPlant | undefined) {
  return useCallback((): StatusInfo => {
    if (!plant) return { color: "bg-gray-500", text: "Unknown" };

    const status = getWateringStatus(
      calculateWateringSchedule(plant),
      plant.latest_watering
    );

    return { color: status.colorClasses, text: status.text };
  }, [plant]);
}

export function useBadgeInfo(
  pendingInsights: PatternInsight[] | undefined,
) {
  const getActionableInsights = useCallback(() => {
    return pendingInsights?.filter((insight) => insight.actionable) || [];
  }, [pendingInsights]);

  const getBadgeInfo = useCallback((): BadgeInfo | null => {
    const actionableInsights = getActionableInsights();
    const count = actionableInsights.length;
    if (count === 0) return null;

    const highPriorityCount = actionableInsights.filter(
      (insight) => insight.severity === "high",
    ).length;
    const hasHighPriority = highPriorityCount > 0;
    const hasMediumPriority = actionableInsights.some(
      (insight) => insight.severity === "medium",
    );

    let text = "";
    let description = "";

    if (hasHighPriority) {
      text =
        highPriorityCount === 1
          ? "Important tip"
          : `${highPriorityCount} important tips`;
      description = `${highPriorityCount} important watering insight${highPriorityCount > 1 ? "s" : ""} available`;
    } else if (hasMediumPriority) {
      text = count === 1 ? "Smart tip" : `${count} smart tips`;
      description = `${count} watering insight${count > 1 ? "s" : ""} available`;
    } else {
      text = count === 1 ? "Good tip" : `${count} good tips`;
      description = `${count} positive watering insight${count > 1 ? "s" : ""} available`;
    }

    return { text, description };
  }, [getActionableInsights]);

  return { getActionableInsights, getBadgeInfo };
}
