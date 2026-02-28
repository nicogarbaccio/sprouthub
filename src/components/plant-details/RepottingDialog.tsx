import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, CheckCircle2, Sprout, Sun } from 'lucide-react';
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

  const advice = getRepottingAdvice(plantNickname, catalogPlant, selectedSize);

  const handleClose = () => {
    // Reset to advice view so it's fresh next time
    setView('advice');
    onClose();
  };

  const handleLogSubmit = async (formData: JournalEntryFormData) => {
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg max-h-[85vh] overflow-y-auto !p-0 flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-6 pb-0 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sprout className="w-5 h-5 text-plant-primary" />
              {view === 'success'
                ? 'Repotting Logged'
                : `Repotting Guide`}
            </DialogTitle>
            {view === 'advice' && (
              <p className="text-sm text-muted-foreground pt-1">
                Tips for repotting {plantNickname}
              </p>
            )}
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4 flex-grow">
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
              isLoading={isLoading}
              onSubmit={handleLogSubmit}
              onBack={() => setView('advice')}
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
    <div className="space-y-5">
      {/* Light info */}
      {advice.lightRequirement && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Sun className="w-4 h-4 flex-shrink-0 text-amber-500" />
          <span>{advice.lightRequirement}</span>
        </div>
      )}

      {/* Size selector chips */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Current plant size</p>
        <div className="flex gap-2">
          {SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSizeChange(option.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-center transition-colors ${
                selectedSize === option.value
                  ? 'border-plant-primary bg-plant-primary/10 text-plant-primary font-medium'
                  : 'border-border text-muted-foreground hover:border-plant-primary/50'
              }`}
            >
              <div className="text-sm font-medium">{option.label}</div>
              <div className="text-xs opacity-70">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Catalog-specific tip */}
      {advice.catalogTip && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
            {catalogPlant?.name ?? 'Species'} tip
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {advice.catalogTip}
          </p>
        </div>
      )}

      {/* General tips */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Repotting tips</p>
        <ul className="space-y-3">
          {advice.tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-plant-primary/10 text-plant-primary text-xs font-medium flex items-center justify-center mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-foreground/80 leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Log button */}
      <Button
        variant="outline"
        onClick={onLogClick}
        className="w-full mt-2"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        Log a Repotting
      </Button>
    </div>
  );
}

// --- Log View ---

function LogView({
  plantId,
  isLoading,
  onSubmit,
  onBack,
}: {
  plantId: string;
  isLoading: boolean;
  onSubmit: (formData: JournalEntryFormData) => Promise<void>;
  onBack: () => void;
}) {
  return (
    <div className="space-y-3">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to tips
      </button>

      <JournalEntryForm
        plantId={plantId}
        onSubmit={onSubmit}
        isLoading={isLoading}
        submitButtonText="Log Repotting"
        initialData={{
          title: 'Repotting',
          content: 'Repotted into fresh soil.',
          mood: 'healthy',
          entryDate: new Date(),
        }}
      />
    </div>
  );
}

// --- Success View ---

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
      </div>
      <div>
        <p className="font-medium text-foreground">Repotting logged!</p>
        <p className="text-sm text-muted-foreground mt-1">
          You can find this entry in your plant journal.
        </p>
      </div>
      <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        Done
      </Button>
    </div>
  );
}
