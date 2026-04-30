import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHouseholds } from '@/hooks/useHouseholds';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Settings, UserPlus, Home, Crown, Shield, Sprout, ArrowRight } from 'lucide-react';
import { CreateHouseholdDialog } from '@/components/households/CreateHouseholdDialog';
import { InviteMemberDialog } from '@/components/households/InviteMemberDialog';
import { HouseholdInvitations } from '@/components/households/HouseholdInvitations';
import { CascadingContainer } from "@/components/ui/cascading-container";
import { LoadingTransition } from "@/components/ui/loading-transition";
import { HouseholdCardSkeleton } from '@/components/ui/skeleton';

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'owner':
      return (
        <Badge className="bg-sprout-cream/20 text-sprout-cream border-sprout-cream/30 font-medium">
          <Crown className="w-3 h-3 mr-1" />
          Owner
        </Badge>
      );
    case 'admin':
      return (
        <Badge className="bg-sprout-water/20 text-sprout-water border-sprout-water/30 font-medium">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="font-medium">
          Member
        </Badge>
      );
  }
};

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Header */}
        <CascadingContainer delay={0}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sprout-dark via-sprout-primary to-sprout-medium p-6 sm:p-8 mb-8">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-sprout-light/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sprout-cream/10 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-sprout-water/10 rounded-full" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">
                    Households
                  </h1>
                </div>
                <p className="text-sprout-light text-base sm:text-lg max-w-lg">
                  Share the joy of plant care! Create households to collaborate with family, friends, and roommates.
                </p>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="w-full sm:w-auto bg-white text-sprout-dark hover:bg-sprout-pale font-semibold shadow-lg shadow-black/10"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Household
              </Button>
            </div>
          </div>
        </CascadingContainer>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <CascadingContainer delay={100}>
            <HouseholdInvitations
              invitations={invitations}
              onAccept={acceptInvitation}
              onDecline={declineInvitation}
            />
          </CascadingContainer>
        )}

        {/* Households Grid */}
        <LoadingTransition
          loading={loading}
          skeleton={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(1)].map((_, i) => (
                <HouseholdCardSkeleton key={i} />
              ))}
            </div>
          }
        >
        {households.length === 0 ? (
          <CascadingContainer delay={200}>
            <Card className="text-center py-16 border-dashed border-2">
              <CardContent>
                <div className="w-20 h-20 mx-auto rounded-full bg-sprout-pale dark:bg-sprout-dark/50 flex items-center justify-center mb-6">
                  <Sprout className="w-10 h-10 text-sprout-medium dark:text-sprout-light" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Start your plant care community
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                  Households let you share plants, coordinate watering schedules, and never let a plant go thirsty again.
                </p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  size="lg"
                  className="font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Household
                </Button>
              </CardContent>
            </Card>
          </CascadingContainer>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {households.map((household, index) => (
              <CascadingContainer key={household.id} delay={200 + index * 100}>
                <Card data-testid="household-card" className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-0 shadow-md">
                  {/* Card accent bar */}
                  <div className="h-1.5 bg-gradient-to-r from-sprout-primary via-sprout-medium to-sprout-light" />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-sprout-pale dark:bg-sprout-dark/50 group-hover:bg-sprout-light/20 transition-colors">
                          <Home className="w-5 h-5 text-sprout-primary dark:text-sprout-light" />
                        </div>
                        <div>
                          <CardTitle className="text-lg leading-tight">{household.name}</CardTitle>
                          {household.description && (
                            <CardDescription className="mt-1">{household.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      {getRoleBadge(household.user_role)}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Member count with avatars */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {household.household_members.slice(0, 4).map((member) => (
                              <div
                                key={member.id}
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-sprout-pale dark:bg-sprout-dark flex items-center justify-center"
                              >
                                {member.role === 'owner' ? (
                                  <Crown className="w-3.5 h-3.5 text-sprout-cream" />
                                ) : member.role === 'admin' ? (
                                  <Shield className="w-3.5 h-3.5 text-sprout-water" />
                                ) : (
                                  <Users className="w-3.5 h-3.5 text-sprout-medium" />
                                )}
                              </div>
                            ))}
                            {household.member_count > 4 && (
                              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  +{household.member_count - 4}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {household.member_count} member{household.member_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Link to={`/households/${household.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full group/btn hover:bg-sprout-pale dark:hover:bg-sprout-dark/50 hover:border-sprout-light transition-colors"
                          >
                            <Settings className="w-4 h-4 mr-2 text-sprout-medium" />
                            Manage
                            <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                          </Button>
                        </Link>
                        {['owner', 'admin'].includes(household.user_role) && (
                          <Button
                            variant="outline"
                            onClick={() => handleInviteMember(household.id)}
                            className="hover:bg-sprout-water/10 hover:border-sprout-water hover:text-sprout-water transition-colors"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CascadingContainer>
            ))}
          </div>
        )}
        </LoadingTransition>

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
