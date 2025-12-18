/**
 * Responsive modal wrapper for pattern insights
 * - Desktop: Center dialog
 * - Mobile: Bottom drawer
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Brain } from 'lucide-react';
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

  // Mobile: Bottom drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh] px-4">
          <DrawerHeader className="text-left px-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sprout-pale dark:bg-sprout-dark/30 rounded-full">
                <Brain className="w-5 h-5 text-sprout-primary" />
              </div>
              <div>
                <DrawerTitle>Smart Care Tips</DrawerTitle>
                <DrawerDescription>
                  Based on your watering pattern for {plantName}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <div className="overflow-y-auto pb-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Center dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sprout-pale dark:bg-sprout-dark/30 rounded-full">
              <Brain className="w-5 h-5 text-sprout-primary" />
            </div>
            <div>
              <DialogTitle>Smart Watering Insights</DialogTitle>
              <DialogDescription>
                Based on your watering pattern for {plantName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default PatternTipsModal;
