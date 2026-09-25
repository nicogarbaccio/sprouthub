import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Mail, UserPlus, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FieldLabel,
  settingsInputClasses,
  settingsPrimaryButtonClasses,
  settingsSecondaryButtonClasses,
} from '@/components/settings/SettingsUI';

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
      <DialogContent data-testid="invite-member-dialog" className="sm:max-w-[460px] border-0 bg-background p-6 sm:rounded-[32px]">
        <DialogHeader className="text-left flex-row items-start gap-3.5 space-y-0">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-sprout-water text-sprout-dark flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <DialogTitle data-testid="invite-member-title" className="font-display text-2xl font-bold tracking-[-0.03em]">
              Invite Member
            </DialogTitle>
            <DialogDescription className="text-sm font-medium mt-0.5">
              They'll get an invitation to help care for this household's plants.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form data-testid="invite-member-form" onSubmit={handleSubmit} className="mt-2">
          <div className="space-y-3">
            <div>
              <FieldLabel htmlFor="invite-email">Email Address</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                  className={cn(settingsInputClasses, "pl-11")}
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <Select value={role} onValueChange={(value: 'member' | 'admin') => setRole(value)}>
                <SelectTrigger id="invite-role" data-testid="invite-role-select" className={settingsInputClasses}>
                  <div className="flex items-center gap-2">
                    {role === 'member' ? (
                      <UserPlus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span>{role === 'member' ? 'Member' : 'Admin'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent data-testid="invite-role-options" className="rounded-2xl p-1">
                  <SelectItem data-testid="role-member-option" value="member" className="rounded-lg py-3 px-3">
                    <div className="flex items-center gap-3">
                      <UserPlus className="w-4 h-4 text-sprout-medium flex-shrink-0" />
                      <div>
                        <div className="font-medium">Member</div>
                        <div className="text-xs text-muted-foreground">
                          Can view and care for household plants
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem data-testid="role-admin-option" value="admin" className="rounded-lg py-3 px-3">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-sprout-medium flex-shrink-0" />
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-muted-foreground">
                          Can invite others and manage household settings
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button
              data-testid="invite-member-cancel-button"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={settingsSecondaryButtonClasses}
            >
              Cancel
            </button>
            <button
              data-testid="invite-member-submit-button"
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className={settingsPrimaryButtonClasses}
            >
              <Mail className="w-4 h-4" />
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};