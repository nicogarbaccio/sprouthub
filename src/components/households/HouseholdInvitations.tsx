import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Mail className="w-5 h-5" />
          Pending Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">
                    {invitation.households?.name || 'Household'}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {invitation.role}
                  </Badge>
                </div>
                {invitation.households?.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {invitation.households.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  {formatExpirationDate(invitation.expires_at)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecline(invitation.id)}
                  className="text-gray-600 hover:text-red-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAccept(invitation.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};