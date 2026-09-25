/**
 * Pattern suggestions for one plant, shown once its watering pattern has been analysed.
 * Same sheet and content as PatternTipsModal; renders nothing until there's an analysis.
 */

import type { PatternInsight, WateringPatternAnalysis } from '@/types/wateringPatternTypes';
import PatternTipsModal from './PatternTipsModal';

interface PatternSuggestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: WateringPatternAnalysis | null;
  insights: PatternInsight[];
  plantName?: string;
  plantId?: string;
  onAcceptSuggestion?: (insight: PatternInsight) => void;
  onDismissAll?: () => void;
}

const PatternSuggestionsDialog = ({ analysis, ...props }: PatternSuggestionsDialogProps) =>
  analysis ? <PatternTipsModal analysis={analysis} {...props} /> : null;

export default PatternSuggestionsDialog;
