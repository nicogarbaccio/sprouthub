import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHouseholds } from '@/hooks/useHouseholds';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Settings, UserPlus, Home } from 'lucide-react';
import { CreateHouseholdDialog } from '@/components/households/CreateHouseholdDialog';
import { InviteMemberDialog } from '@/components/households/InviteMemberDialog';
import { HouseholdInvitations } from '@/components/households/HouseholdInvitations';
import { HouseholdMembersCard } from '@/components/households/HouseholdMembersCard';
import { HouseholdCardSkeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const Households = () => {
  const { user } = useAuth();
  const {
    households,
    invitations,
    loading,
    createHousehold,
    inviteToHousehold,
    acceptInvitation,
    declineInvitation,
    leaveHousehold,
    removeMember,
  } = useHouseholds();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('');

  if (!user) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Please sign in to manage households
            </h1>
          </div>
        </div>
      </div>
    );
  }

  const handleInviteMember = (householdId: string) => {
    setSelectedHouseholdId(householdId);
    setInviteDialogOpen(true);
  };

  return (
    <div>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Households
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Collaborate with others to care for plants together
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Household
            </Button>
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <HouseholdInvitations
            invitations={invitations}
            onAccept={acceptInvitation}
            onDecline={declineInvitation}
          />
        )}

        {/* Households Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(1)].map((_, i) => (
              <HouseholdCardSkeleton key={i} />
            ))}
          </div>
        ) : households.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No households yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Create a household to start collaborating with others on plant care
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Household
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {households.map((household) => (
              <Card key={household.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{household.name}</CardTitle>
                    <Badge variant={household.user_role === 'owner' ? 'default' : 'secondary'}>
                      {household.user_role}
                    </Badge>
                  </div>
                  {household.description && (
                    <CardDescription>{household.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Users className="w-4 h-4 mr-2" />
                      {household.member_count} member{household.member_count !== 1 ? 's' : ''}
                    </div>

                    <HouseholdMembersCard
                      household={household}
                      currentUserId={user.id}
                      canManage={['owner', 'admin'].includes(household.user_role)}
                      onRemoveMember={removeMember}
                      onLeaveHousehold={leaveHousehold}
                    />

                    <div className="flex gap-2 pt-4 border-t">
                      <Link to={`/households/${household.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </Link>
                      {['owner', 'admin'].includes(household.user_role) && (
                        <Button
                          variant="outline"
                          onClick={() => handleInviteMember(household.id)}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <CreateHouseholdDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={createHousehold}
        />

        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          householdId={selectedHouseholdId}
          onSubmit={inviteToHousehold}
        />
      </div>
    </div>
  );
};

export default Households;