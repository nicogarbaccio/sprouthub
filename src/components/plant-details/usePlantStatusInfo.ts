import { useCallback } from "react";
import { calculateWateringSchedule } from "@/utils/watering-schedule";
import type { UserPlant } from "@/hooks/useUserPlants";
import type { PatternInsight } from "@/types/wateringPatternTypes";

export interface StatusInfo {
  color: string;
  text: string;
}

export interface BadgeInfo {
  text: string;
  colorClass: string;
  description: string;
}

export function useStatusInfo(plant: UserPlant | undefined) {
  return useCallback((): StatusInfo => {
    if (!plant) return { color: "bg-gray-500", text: "Unknown" };

    const wateringCalc = calculateWateringSchedule(plant);
    const {
      daysUntilWatering,
      isOverdue,
      isPostponed,
      hasUnknownWateringDate,
    } = wateringCalc;

    if (hasUnknownWateringDate) {
      return { color: "bg-neutral-500 text-white", text: "Unknown schedule" };
    }
    if (isPostponed) {
      if (daysUntilWatering === 0)
        return {
          color: "bg-sprout-water text-white",
          text: "Postponed until later today",
        };
      if (daysUntilWatering === 1)
        return {
          color: "bg-sprout-water text-white",
          text: "Postponed until tomorrow",
        };
      return {
        color: "bg-sprout-water text-white",
        text: `Postponed for ${daysUntilWatering} days`,
      };
    }
    if (isOverdue) {
      return {
        color: "bg-red-500 text-white",
        text: `Overdue by ${Math.abs(daysUntilWatering)} days`,
      };
    }
    if (daysUntilWatering === 0) {
      return { color: "bg-orange-500 text-white", text: "Due today" };
    }
    if (daysUntilWatering <= 2) {
      return {
        color: "bg-orange-500 text-white",
        text: `Due in ${daysUntilWatering} days`,
      };
    }
    return {
      color: "bg-sprout-success text-white",
      text: `Due in ${daysUntilWatering} days`,
    };
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
    let colorClass = "";
    let description = "";

    if (hasHighPriority) {
      text =
        highPriorityCount === 1
          ? "Important tip"
          : `${highPriorityCount} important tips`;
      description = `${highPriorityCount} important watering insight${highPriorityCount > 1 ? "s" : ""} available`;
      colorClass =
        "bg-amber-500 hover:bg-amber-600 text-white border-amber-500";
    } else if (hasMediumPriority) {
      text = count === 1 ? "Smart tip" : `${count} smart tips`;
      description = `${count} watering insight${count > 1 ? "s" : ""} available`;
      colorClass = "bg-blue-500 hover:bg-blue-600 text-white border-blue-500";
    } else {
      text = count === 1 ? "Good tip" : `${count} good tips`;
      description = `${count} positive watering insight${count > 1 ? "s" : ""} available`;
      colorClass =
        "bg-green-500 hover:bg-green-600 text-white border-green-500";
    }

    return { text, colorClass, description };
  }, [getActionableInsights]);

  return { getActionableInsights, getBadgeInfo };
}
