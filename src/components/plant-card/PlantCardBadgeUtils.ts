import type { PatternInsight } from "@/types/wateringPatternTypes";

export interface BadgeInfo {
  message: string;
  ariaLabel: string;
  classNames: string;
  severity: string;
  count: number;
}

export function getActionableInsights(visiblePendingInsights: PatternInsight[]) {
  return visiblePendingInsights.filter((insight) => insight.actionable);
}

export function getSuggestionMetadata(visiblePendingInsights: PatternInsight[]) {
  const actionableInsights = getActionableInsights(visiblePendingInsights);
  const count = actionableInsights.length;
  const highPriorityCount = actionableInsights.filter(
    (insight) => insight.severity === "high"
  ).length;
  const mediumPriorityCount = actionableInsights.filter(
    (insight) => insight.severity === "medium"
  ).length;
  const types = [
    ...new Set(actionableInsights.map((insight) => insight.type)),
  ];
  const hasScheduleAdjustment = types.includes("schedule_adjustment");
  const hasWateringIssues =
    types.includes("overwatering_risk") ||
    types.includes("underwatering_risk");
  const highestSeverity =
    highPriorityCount > 0
      ? "high"
      : mediumPriorityCount > 0
      ? "medium"
      : "low";

  return {
    count,
    highPriorityCount,
    types,
    hasScheduleAdjustment,
    hasWateringIssues,
    highestSeverity,
    actionableInsights,
  };
}

export function getBadgeInfo(
  hasPendingSuggestions: boolean,
  visiblePendingInsights: PatternInsight[]
): BadgeInfo | null {
  if (!hasPendingSuggestions) return null;

  const metadata = getSuggestionMetadata(visiblePendingInsights);
  const {
    count,
    highPriorityCount,
    hasScheduleAdjustment,
    hasWateringIssues,
    highestSeverity,
  } = metadata;

  // Determine message based on priority and type
  let message = "";
  let ariaLabel = "";

  if (highPriorityCount > 0) {
    if (highPriorityCount === 1 && count === 1) {
      message = hasWateringIssues ? "Urgent watering tip" : "Important tip";
      ariaLabel = `${highPriorityCount} urgent plant care suggestion available`;
    } else if (highPriorityCount > 1) {
      message = `${highPriorityCount} urgent tips`;
      ariaLabel = `${highPriorityCount} urgent plant care suggestions available`;
    } else {
      message = `${count} tips (${highPriorityCount} urgent)`;
      ariaLabel = `${count} plant care suggestions available, ${highPriorityCount} urgent`;
    }
  } else {
    if (count === 1) {
      if (hasScheduleAdjustment) {
        message = "Schedule tip";
        ariaLabel = "1 watering schedule suggestion available";
      } else if (hasWateringIssues) {
        message = "Watering tip";
        ariaLabel = "1 watering pattern suggestion available";
      } else {
        message = "Care tip";
        ariaLabel = "1 plant care suggestion available";
      }
    } else {
      if (hasScheduleAdjustment && hasWateringIssues) {
        message = `${count} care tips`;
        ariaLabel = `${count} plant care suggestions available`;
      } else if (hasScheduleAdjustment) {
        message = `${count} schedule tips`;
        ariaLabel = `${count} watering schedule suggestions available`;
      } else if (hasWateringIssues) {
        message = `${count} watering tips`;
        ariaLabel = `${count} watering pattern suggestions available`;
      } else {
        message = `${count} care tips`;
        ariaLabel = `${count} plant care suggestions available`;
      }
    }
  }

  // Determine styling based on severity
  let bgColor = "";
  let textColor = "";
  let borderColor = "";
  let darkBgColor = "";
  let darkTextColor = "";
  let darkBorderColor = "";

  switch (highestSeverity) {
    case "high":
      bgColor = "bg-amber-100";
      textColor = "text-amber-800";
      borderColor = "border-amber-200";
      darkBgColor = "dark:bg-amber-950/40";
      darkTextColor = "dark:text-amber-300";
      darkBorderColor = "dark:border-amber-700";
      break;
    case "medium":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      borderColor = "border-blue-200";
      darkBgColor = "dark:bg-blue-950/40";
      darkTextColor = "dark:text-blue-300";
      darkBorderColor = "dark:border-blue-700";
      break;
    default:
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      borderColor = "border-green-200";
      darkBgColor = "dark:bg-green-950/40";
      darkTextColor = "dark:text-green-300";
      darkBorderColor = "dark:border-green-700";
      break;
  }

  const classNames = `px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} ${darkBgColor} ${darkTextColor} ${darkBorderColor}`;

  return {
    message,
    ariaLabel,
    classNames,
    severity: highestSeverity,
    count,
  };
}

export function getStatusColor(
  hasUnknownWateringDate: boolean,
  isOverdue: boolean,
  isPostponed: boolean | undefined,
  daysUntilWatering: number,
  lastWateredDate?: string
) {
  if (hasUnknownWateringDate)
    return "bg-neutral-500 text-white border-neutral-500";
  if (isOverdue) return "bg-red-500 text-white border-red-500";
  if (isPostponed) return "bg-sprout-water text-white border-sprout-water";

  if (daysUntilWatering === 0) {
    if (lastWateredDate) {
      const today = new Date();
      const lastWateredDateObj = new Date(lastWateredDate);
      const timeDiff = today.getTime() - lastWateredDateObj.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff <= 12) {
        return "bg-sprout-success text-white border-sprout-success";
      }
    }
    return "bg-orange-500 text-white border-orange-500";
  }

  if (daysUntilWatering <= 2)
    return "bg-orange-500 text-white border-orange-500";

  return "bg-sprout-success text-white border-sprout-success";
}

export function getStatusText(
  hasUnknownWateringDate: boolean,
  isOverdue: boolean,
  isPostponed: boolean | undefined,
  daysUntilWatering: number,
  lastWateredDate?: string
) {
  if (hasUnknownWateringDate) return "Unknown schedule";
  if (isPostponed) {
    if (daysUntilWatering === 0) return "Postponed until later today";
    if (daysUntilWatering === 1) return "Postponed until tomorrow";
    return `Postponed for ${daysUntilWatering} days`;
  }
  if (isOverdue) return `Overdue by ${Math.abs(daysUntilWatering)} days`;

  if (daysUntilWatering === 0) {
    if (lastWateredDate) {
      const today = new Date();
      const lastWateredDateObj = new Date(lastWateredDate);
      const timeDiff = today.getTime() - lastWateredDateObj.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff <= 12) {
        return "Watered today";
      }
    }
    return "Due today";
  }

  if (daysUntilWatering === 1) return "Water tomorrow";
  if (daysUntilWatering < 0)
    return `Overdue by ${Math.abs(daysUntilWatering)} days`;
  return `Water in ${daysUntilWatering} days`;
}
