import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Home, Plus } from 'lucide-react';
import {
  FieldLabel,
  settingsInputClasses,
  settingsPrimaryButtonClasses,
  settingsSecondaryButtonClasses,
} from '@/components/settings/SettingsUI';

interface CreateHouseholdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description?: string) => Promise<boolean>;
}

export const CreateHouseholdDialog: React.FC<CreateHouseholdDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit(name.trim(), description.trim() || undefined);
      if (success) {
        setName('');
        setDescription('');
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="create-household-dialog" className="sm:max-w-[460px] border-0 bg-background p-6 sm:rounded-[32px]">
        <DialogHeader className="text-left flex-row items-start gap-3.5 space-y-0">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-sprout-primary text-sprout-cream flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <DialogTitle data-testid="create-household-title" className="font-display text-2xl font-bold tracking-[-0.03em]">
              Create Household
            </DialogTitle>
            <DialogDescription className="text-sm font-medium mt-0.5">
              Share plants and watering with the people you live with.
            </DialogDescription>
          </div>
        </DialogHeader>
        <form data-testid="create-household-form" onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div>
            <FieldLabel htmlFor="household-name">Household Name</FieldLabel>
            <Input
              data-testid="household-name-input"
              id="household-name"
              placeholder="e.g. The Smith Family, Apartment 4B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              className={settingsInputClasses}
            />
          </div>
          <div>
            <FieldLabel htmlFor="household-description">Description (Optional)</FieldLabel>
            <Textarea
              data-testid="household-description-input"
              id="household-description"
              placeholder="A few words about your household"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="rounded-2xl border-0 bg-field text-[15px] font-medium resize-none focus-visible:ring-2 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              data-testid="create-household-cancel-button"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={settingsSecondaryButtonClasses}
            >
              Cancel
            </button>
            <button
              data-testid="create-household-submit-button"
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className={settingsPrimaryButtonClasses}
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              {isSubmitting ? 'Creating...' : 'Create Household'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
