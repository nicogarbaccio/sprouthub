import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookOpen, CheckCircle2, ChevronLeft, Sprout, Sun, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetPrimaryButtonClasses,
  sheetTitleClasses,
} from '@/components/ui/bento-sheet';
import { JournalEntryForm } from '@/components/journal/JournalEntryForm';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import {
  getRepottingAdvice,
  type PlantSize,
} from '@/utils/plants/repottingAdvice';
import type { CatalogPlant } from '@/data/types';
import type { JournalEntryFormData } from '@/types/journalTypes';

interface RepottingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plantId: string;
  plantNickname: string;
  catalogPlant: CatalogPlant | undefined;
}

type DialogView = 'advice' | 'log' | 'success';

const SIZE_OPTIONS: { value: PlantSize; label: string; description: string }[] = [
  { value: 'small', label: 'Small', description: '< 6" pot' },
  { value: 'medium', label: 'Medium', description: '6–10" pot' },
  { value: 'large', label: 'Large', description: '10"+ pot' },
];

export function RepottingDialog({
  isOpen,
  onClose,
  plantId,
  plantNickname,
  catalogPlant,
}: RepottingDialogProps) {
  const [view, setView] = useState<DialogView>('advice');
  const [selectedSize, setSelectedSize] = useState<PlantSize>('medium');
  const { addJournalEntry, isLoading } = useJournalEntries();
  const contentRef = useRef<HTMLDivElement>(null);

  // Each view starts at the top, so the header and back button are in view
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [view]);

  const advice = getRepottingAdvice(plantNickname, catalogPlant, selectedSize);

  const handleClose = () => {
    // Reset to advice view so it's fresh next time
    setView('advice');
    setIsSubmitting(false);
    onClose();
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogSubmit = async (formData: JournalEntryFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await addJournalEntry(
        plantId,
        formData.title,
        formData.content,
        formData.mood,
        formData.images,
        formData.entryDate,
        formData.relatedWateringRecordId
      );
      if (success) {
        setView('success');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent ref={contentRef} className={dialogSheetClasses} onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetGrabber />
        <DialogHeader className={sheetHeaderClasses}>
          {view === 'log' ? (
            <button
              type="button"
              onClick={() => setView('advice')}
              className={sheetIconButtonClasses}
              aria-label="Back to tips"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div
              className={cn(
                'w-[52px] h-[52px] shrink-0 rounded-[18px] flex items-center justify-center',
                view === 'success' ? 'bg-sprout-success text-sprout-dark' : 'bg-sprout-primary text-sprout-cream'
              )}
            >
              {view === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <Sprout className="w-6 h-6" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <DialogTitle className={sheetTitleClasses}>
              {view === 'success' ? 'Repotting logged!' : view === 'log' ? 'Log a Repotting' : 'Repotting Guide'}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium">
              {view === 'success' ? plantNickname : view === 'log' ? `A journal entry for ${plantNickname}` : `Tips for repotting ${plantNickname}`}
            </DialogDescription>
          </div>
          <button type="button" onClick={handleClose} className={cn(sheetIconButtonClasses, 'self-start')} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="mt-4">
          {view === 'advice' && (
            <AdviceView
              advice={advice}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              onLogClick={() => setView('log')}
              catalogPlant={catalogPlant}
            />
          )}

          {view === 'log' && (
            <LogView
              plantId={plantId}
              isLoading={isLoading || isSubmitting}
              onSubmit={handleLogSubmit}
            />
          )}

          {view === 'success' && (
            <SuccessView onClose={handleClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Advice View ---

function AdviceView({
  advice,
  selectedSize,
  onSizeChange,
  onLogClick,
  catalogPlant,
}: {
  advice: ReturnType<typeof getRepottingAdvice>;
  selectedSize: PlantSize;
  onSizeChange: (size: PlantSize) => void;
  onLogClick: () => void;
  catalogPlant: CatalogPlant | undefined;
}) {
  return (
    <div className="space-y-2">
      {/* Light info */}
      {advice.lightRequirement && (
        <div className="flex items-center gap-2.5 rounded-[20px] bg-sprout-cream text-sprout-dark px-4 py-3 text-sm font-semibold">
          <Sun className="w-5 h-5 shrink-0" />
          <span>{advice.lightRequirement}</span>
        </div>
      )}

      {/* Size selector chips */}
      <div className="rounded-3xl bg-card p-4">
        <p className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">Current plant size</p>
        <div className="grid grid-cols-3 gap-2 mt-2.5">
          {SIZE_OPTIONS.map((option) => {
            const selected = selectedSize === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onSizeChange(option.value)}
                className={cn(
                  'min-h-[60px] rounded-[18px] px-2 py-2.5 text-center transition-colors',
                  selected ? 'bg-sprout-cream text-sprout-dark' : 'bg-field text-foreground hover:bg-field/70'
                )}
              >
                <div className="text-[15px] font-bold">{option.label}</div>
                <div className={cn('text-xs font-medium', selected ? 'opacity-80' : 'text-muted-foreground')}>
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog-specific tip */}
      {advice.catalogTip && (
        <div className="rounded-3xl bg-sprout-primary text-sprout-cream p-4">
          <p className="text-xs font-bold tracking-[0.8px] uppercase opacity-90">
            {catalogPlant?.name ?? 'Species'} tip
          </p>
          <p className="text-[15px] font-medium leading-relaxed mt-1">{advice.catalogTip}</p>
        </div>
      )}

      {/* General tips */}
      <div className="rounded-3xl bg-card p-4">
        <p className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">Repotting tips</p>
        <ol className="space-y-3 mt-3">
          {advice.tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-field text-foreground font-display text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-[15px] text-foreground leading-relaxed pt-0.5">{tip}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Log button */}
      <button type="button" onClick={onLogClick} className={cn(sheetPrimaryButtonClasses, 'mt-1')}>
        <BookOpen className="w-5 h-5" />
        Log a Repotting
      </button>
    </div>
  );
}

// --- Log View ---

function LogView({
  plantId,
  isLoading,
  onSubmit,
}: {
  plantId: string;
  isLoading: boolean;
  onSubmit: (formData: JournalEntryFormData) => Promise<void>;
}) {
  return (
    <JournalEntryForm
      plantId={plantId}
      onSubmit={onSubmit}
      isLoading={isLoading}
      submitButtonText="Log Repotting"
      heading={null}
      initialData={{
        title: 'Repotting',
        content: 'Repotted into fresh soil.',
        mood: 'healthy',
        entryDate: new Date(),
      }}
    />
  );
}

// --- Success View ---

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-2">
      <p className="rounded-3xl bg-sprout-success text-sprout-dark px-5 py-4 text-[15px] font-semibold">
        You can find this entry in your plant journal.
      </p>
      <button type="button" onClick={onClose} className={sheetPrimaryButtonClasses}>
        Done
      </button>
    </div>
  );
}
