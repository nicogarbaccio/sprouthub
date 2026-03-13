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
} from '@/components/ui/select';
import { Mail, UserPlus, Shield } from 'lucide-react';

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
      <DialogContent data-testid="invite-member-dialog" className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl">
        {/* Header with accent background */}
        <div className="bg-gradient-to-br from-sprout-primary to-sprout-medium px-8 pt-8 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <DialogHeader className="space-y-1 text-left flex-1 min-w-0">
              <DialogTitle data-testid="invite-member-title" className="text-white text-lg font-semibold">
                Invite Member
              </DialogTitle>
              <DialogDescription className="text-white/75 text-sm leading-relaxed">
                Send an invitation to collaborate on this household's plants.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <form data-testid="invite-member-form" onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="grid gap-5 pt-6">
            <div className="grid gap-2">
              <Label htmlFor="invite-email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                  className="pl-10 h-11 rounded-xl border-border/50 focus:border-sprout-medium"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role" className="text-sm font-medium">
                Role
              </Label>
              <Select value={role} onValueChange={(value: 'member' | 'admin') => setRole(value)}>
                <SelectTrigger data-testid="invite-role-select" className="h-11 rounded-xl border-border/50">
                  <div className="flex items-center gap-2">
                    {role === 'member' ? (
                      <UserPlus className="w-4 h-4 text-sprout-medium flex-shrink-0" />
                    ) : (
                      <Shield className="w-4 h-4 text-sprout-medium flex-shrink-0" />
                    )}
                    <span>{role === 'member' ? 'Member' : 'Admin'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent data-testid="invite-role-options" className="rounded-xl p-1">
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
          <DialogFooter className="mt-8 gap-3 sm:gap-3">
            <Button
              data-testid="invite-member-cancel-button"
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              data-testid="invite-member-submit-button"
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="rounded-xl bg-sprout-medium hover:bg-sprout-primary text-white shadow-md flex-1 sm:flex-none"
            >
              <Mail className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};