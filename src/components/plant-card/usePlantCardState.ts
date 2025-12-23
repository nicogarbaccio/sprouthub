/**
 * Custom hook to manage MyPlantCard state
 * Extracted from MyPlantCard.tsx to reduce component complexity
 */

import { useState, useMemo } from 'react';
import { useBulkSelection } from '@/contexts/BulkSelectionContext';
import { useQuickPatternAnalysis, useWateringPatternAnalysis } from '@/hooks/useWateringPatternAnalysis';
import { useDismissedInsights } from '@/hooks/useDismissedInsights';
import { shouldShowOverwateringWarning } from '@/utils/overwatering';
import type { OverwateringRisk } from '@/utils/overwatering';

interface UsePlantCardStateProps {
  id: string;
  lastWateredDate?: string;
  suggestedWateringDays: number;
  overwatering?: OverwateringRisk;
}

export const usePlantCardState = ({
  id,
  lastWateredDate,
  suggestedWateringDays,
  overwatering,
}: UsePlantCardStateProps) => {
  // Dialog states
  const [showWaterConfirmation, setShowWaterConfirmation] = useState(false);
  const [showPostponeConfirmation, setShowPostponeConfirmation] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [showPatternSuggestions, setShowPatternSuggestions] = useState(false);
  const [showPendingTips, setShowPendingTips] = useState(false);
  const [patternAnalysis, setPatternAnalysis] = useState(null);
  const [patternInsights, setPatternInsights] = useState([]);

  // Bulk selection
  const { isSelectionMode, isPlantSelected, togglePlantSelection } = useBulkSelection();
  const isSelected = isPlantSelected(id);

  // Pattern analysis
  const { analyzeQuick, isAnalyzing } = useQuickPatternAnalysis();
  const { insights: pendingInsights } = useWateringPatternAnalysis({
    plantId: id,
    autoRefresh: true,
  });

  // Filter dismissed insights
  const { filterDismissed } = useDismissedInsights(id);
  const visiblePendingInsights = useMemo(
    () => filterDismissed(pendingInsights),
    [filterDismissed, pendingInsights]
  );

  // Overwatering state
  const isOverwateringActive = !!(overwatering && overwatering.level !== 'none');
  const { showWarning: showOverwateringWarning, daysSinceLastWatered } =
    shouldShowOverwateringWarning(lastWateredDate, suggestedWateringDays);

  // Pending suggestions
  const hasPendingSuggestions = visiblePendingInsights.some((insight) => insight.actionable);

  const getActionableInsights = () =>
    visiblePendingInsights.filter((insight) => insight.actionable);

  const getSuggestionMetadata = () => {
    const actionableInsights = getActionableInsights();
    const count = actionableInsights.length;
    const highPriorityCount = actionableInsights.filter(
      (insight) => insight.severity === 'high'
    ).length;
    const mediumPriorityCount = actionableInsights.filter(
      (insight) => insight.severity === 'medium'
    ).length;
    const types = [...new Set(actionableInsights.map((insight) => insight.type))];

    return {
      count,
      highPriorityCount,
      mediumPriorityCount,
      types,
      hasHighPriority: highPriorityCount > 0,
      hasMediumPriority: mediumPriorityCount > 0,
    };
  };

  return {
    // Dialog states
    showWaterConfirmation,
    setShowWaterConfirmation,
    showPostponeConfirmation,
    setShowPostponeConfirmation,
    showFullscreenImage,
    setShowFullscreenImage,
    showPatternSuggestions,
    setShowPatternSuggestions,
    showPendingTips,
    setShowPendingTips,
    patternAnalysis,
    setPatternAnalysis,
    patternInsights,
    setPatternInsights,

    // Selection
    isSelectionMode,
    isSelected,
    togglePlantSelection,

    // Pattern analysis
    analyzeQuick,
    isAnalyzing,
    visiblePendingInsights,

    // Overwatering
    isOverwateringActive,
    showOverwateringWarning,
    daysSinceLastWatered,

    // Suggestions
    hasPendingSuggestions,
    getActionableInsights,
    getSuggestionMetadata,
  };
};
