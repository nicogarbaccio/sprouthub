/**
 * Modal wrapper for pattern insights: a bottom sheet on phones, a centered panel from `sm` up
 */

import { useIsMobile } from '@/hooks/use-mobile';
import { useHaptic } from '@/hooks/use-touch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Brain, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetTitleClasses,
} from '@/components/ui/bento-sheet';
import PatternTipsContent from './PatternTipsContent';
import {
  PatternInsight,
  WateringPatternAnalysis
} from '@/types/wateringPatternTypes';

interface PatternTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: WateringPatternAnalysis | null;
  insights: PatternInsight[];
  plantName?: string;
  plantId?: string;
  onAcceptSuggestion?: (insight: PatternInsight) => void;
  onDismissInsight?: (insight: PatternInsight, index: number) => void;
  onDismissAll?: () => void;
  showPatternSummary?: boolean;
}

const PatternTipsModal = ({
  isOpen,
  onClose,
  analysis,
  insights,
  plantName = 'your plant',
  plantId,
  onAcceptSuggestion,
  onDismissInsight,
  onDismissAll,
  showPatternSummary = true,
}: PatternTipsModalProps) => {
  const isMobile = useIsMobile();
  const { lightImpact, success } = useHaptic();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isMobile) {
        lightImpact();
      }
      onClose();
    }
  };

  const handleAcceptWithFeedback = (insight: PatternInsight) => {
    if (isMobile) {
      success();
    }
    onAcceptSuggestion?.(insight);
    onClose();
  };

  const handleDismissWithFeedback = (insight: PatternInsight, index: number) => {
    if (isMobile) {
      lightImpact();
    }
    onDismissInsight?.(insight, index);
  };

  const content = (
    <PatternTipsContent
      analysis={analysis}
      insights={insights}
      plantName={plantName}
      plantId={plantId}
      onAcceptSuggestion={handleAcceptWithFeedback}
      onDismissInsight={handleDismissWithFeedback}
      onDismissAll={onDismissAll}
      onClose={onClose}
      showPatternSummary={showPatternSummary}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={dialogSheetClasses}>
        <SheetGrabber />
        <DialogHeader className={sheetHeaderClasses}>
          <div className="w-[52px] h-[52px] shrink-0 rounded-[18px] bg-sprout-primary text-sprout-cream flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className={sheetTitleClasses}>Watering insights</DialogTitle>
            <DialogDescription className="text-sm font-medium">
              Based on your watering pattern for {plantName}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className={cn(sheetIconButtonClasses, 'self-start')}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>
        <div className="mt-4">{content}</div>
      </DialogContent>
    </Dialog>
  );
};

export default PatternTipsModal;
