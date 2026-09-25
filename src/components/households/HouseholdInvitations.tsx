import React from 'react';
import { Mail, Check, X, Clock } from 'lucide-react';
import type { HouseholdInvitation } from '@/hooks/useHouseholds';

interface HouseholdInvitationsProps {
  invitations: HouseholdInvitation[];
  onAccept: (invitationId: string) => Promise<boolean>;
  onDecline: (invitationId: string) => Promise<boolean>;
}

export const HouseholdInvitations: React.FC<HouseholdInvitationsProps> = ({
  invitations,
  onAccept,
  onDecline,
}) => {
  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${diffDays} days`;
    }
  };

  return (
    <section aria-labelledby="invitations-heading">
      <h2
        id="invitations-heading"
        className="flex items-center gap-2 font-display text-xl font-bold tracking-[-0.02em] text-foreground px-1.5 lg:px-1"
      >
        <Mail className="w-5 h-5" />
        Invitations
        <span className="text-[13px] font-bold px-[9px] py-[3px] rounded-full bg-card text-muted-foreground font-sans tracking-normal">
          {invitations.length}
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="rounded-tile bg-sprout-cream text-sprout-dark p-5 flex flex-col gap-4"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-xl font-bold tracking-[-0.02em]">
                  {invitation.households?.name || 'Household'}
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-dark/10 capitalize">
                  {invitation.role}
                </span>
              </div>
              {invitation.households?.description && (
                <p className="text-sm font-medium mt-1 opacity-90">{invitation.households.description}</p>
              )}
              <div className="flex items-center gap-1.5 text-[13px] font-semibold mt-2 opacity-80">
                <Clock className="w-3.5 h-3.5" />
                {formatExpirationDate(invitation.expires_at)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onDecline(invitation.id)}
                className="h-12 px-5 rounded-2xl bg-sprout-dark/10 font-bold text-[15px] inline-flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
              <button
                type="button"
                onClick={() => onAccept(invitation.id)}
                className="flex-1 h-12 rounded-2xl bg-sprout-dark text-sprout-cream font-bold text-[15px] inline-flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
