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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  onSubmit: (householdId: string, email: string, role: 'member' | 'admin') => Promise<boolean>;
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  open,
  onOpenChange,
  householdId,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !householdId) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit(householdId, email.trim(), role);
      if (success) {
        setEmail('');
        setRole('member');
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setRole('member');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="invite-member-dialog" className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle data-testid="invite-member-title">Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation to collaborate on this household's plants.
          </DialogDescription>
        </DialogHeader>
        <form data-testid="invite-member-form" onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                data-testid="invite-email-input"
                id="invite-email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                inputMode="email"
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={(value: 'member' | 'admin') => setRole(value)}>
                <SelectTrigger data-testid="invite-role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent data-testid="invite-role-options">
                  <SelectItem data-testid="role-member-option" value="member">
                    <div>
                      <div className="font-medium">Member</div>
                      <div className="text-sm text-muted-foreground">
                        Can view and care for household plants
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem data-testid="role-admin-option" value="admin">
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-sm text-muted-foreground">
                        Can invite others and manage household settings
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="invite-member-cancel-button"
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button data-testid="invite-member-submit-button" type="submit" disabled={!email.trim() || isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};