import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
      <DialogContent data-testid="create-household-dialog" className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle data-testid="create-household-title">Create Household</DialogTitle>
          <DialogDescription>
            Create a new household to collaborate with others on plant care.
          </DialogDescription>
        </DialogHeader>
        <form data-testid="create-household-form" onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="household-name">Household Name</Label>
              <Input
                data-testid="household-name-input"
                id="household-name"
                placeholder="e.g., The Smith Family, Apartment 4B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="household-description">Description (Optional)</Label>
              <Textarea
                data-testid="household-description-input"
                id="household-description"
                placeholder="Brief description of your household..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="create-household-cancel-button"
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button data-testid="create-household-submit-button" type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Household'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};