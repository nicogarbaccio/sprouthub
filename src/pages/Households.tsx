import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHouseholds } from '@/hooks/useHouseholds';
import { cn } from '@/lib/utils';
import { Users, Plus, Settings, UserPlus, Home, Crown, Shield, Sprout } from 'lucide-react';
import { CreateHouseholdDialog } from '@/components/households/CreateHouseholdDialog';
import { InviteMemberDialog } from '@/components/households/InviteMemberDialog';
import { HouseholdInvitations } from '@/components/households/HouseholdInvitations';
import { CascadingContainer } from "@/components/ui/cascading-container";
import { LoadingTransition } from "@/components/ui/loading-transition";
import { HouseholdCardSkeleton } from '@/components/ui/skeleton';

const RolePill = ({ role }: { role: string }) => {
  const config =
    role === 'owner'
      ? { icon: Crown, label: 'Owner', classes: 'bg-sprout-cream text-sprout-dark' }
      : role === 'admin'
        ? { icon: Shield, label: 'Admin', classes: 'bg-sprout-water text-sprout-dark' }
        : { icon: Users, label: 'Member', classes: 'bg-field text-foreground' };
  const Icon = config.icon;
  return (
    <span className={cn('shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full', config.classes)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">
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
    <div className="bg-background pb-32 lg:pb-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-3.5 lg:pt-7">
        <CascadingContainer delay={0}>
          <div className="flex items-end justify-between gap-3 px-1.5 lg:px-0">
            <div className="min-w-0">
              <h1 className="font-display text-[28px] lg:text-[34px] font-bold tracking-[-0.04em] text-foreground">
                Households
              </h1>
              <p className="text-sm lg:text-[15px] font-medium text-muted-foreground mt-0.5 max-w-xl">
                Share the joy of plant care with family, friends and roommates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              aria-label="Create Household"
              className="shrink-0 h-12 w-12 lg:w-auto lg:px-5 rounded-2xl bg-sprout-cream text-sprout-dark font-bold text-[15px] inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-[22px] h-[22px]" strokeWidth={2.5} />
              <span className="hidden lg:inline">Create Household</span>
            </button>
          </div>
        </CascadingContainer>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <CascadingContainer delay={50}>
            <div className="mt-[18px]">
              <HouseholdInvitations
                invitations={invitations}
                onAccept={acceptInvitation}
                onDecline={declineInvitation}
              />
            </div>
          </CascadingContainer>
        )}

        {/* Households Grid */}
        <div className="mt-[18px]">
        <LoadingTransition
          loading={loading}
          skeleton={
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...Array(1)].map((_, i) => (
                <HouseholdCardSkeleton key={i} />
              ))}
            </div>
          }
        >
        {households.length === 0 ? (
          <CascadingContainer delay={100}>
            <div className="rounded-tile bg-sprout-cream text-sprout-dark p-6 md:p-8 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-16 w-56 h-56 rounded-full bg-sprout-dark opacity-[0.08]" aria-hidden="true" />
              <div className="relative w-14 h-14 rounded-2xl bg-sprout-dark text-sprout-cream flex items-center justify-center">
                <Sprout className="w-7 h-7" />
              </div>
              <h2 className="relative font-display text-2xl md:text-[28px] font-bold tracking-[-0.03em] mt-4">
                Start your plant care community
              </h2>
              <p className="relative text-[15px] font-medium mt-1.5 max-w-[46ch]">
                Households let you share plants, coordinate watering, and never let a plant go thirsty again.
              </p>
              <button
                type="button"
                onClick={() => setCreateDialogOpen(true)}
                className="relative mt-5 h-14 px-6 rounded-[22px] bg-sprout-dark text-sprout-cream font-display font-bold inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
                Create your first household
              </button>
            </div>
          </CascadingContainer>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {households.map((household, index) => {
              const canInvite = ['owner', 'admin'].includes(household.user_role);
              return (
                <CascadingContainer key={household.id} delay={100 + index * 75}>
                  <div data-testid="household-card" className="rounded-tile bg-card p-5 flex flex-col gap-4 h-full">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 shrink-0 rounded-2xl bg-sprout-primary text-sprout-cream flex items-center justify-center">
                        <Home className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-foreground truncate">
                          {household.name}
                        </h3>
                        {household.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{household.description}</p>
                        )}
                      </div>
                      <RolePill role={household.user_role} />
                    </div>

                    {/* Members */}
                    <div className="flex items-center gap-3 rounded-[18px] bg-field px-3.5 py-3">
                      <div className="flex -space-x-2">
                        {household.household_members.slice(0, 4).map((member) => (
                          <div
                            key={member.id}
                            className={cn(
                              'w-8 h-8 rounded-full border-2 border-field flex items-center justify-center',
                              member.role === 'owner'
                                ? 'bg-sprout-cream text-sprout-dark'
                                : member.role === 'admin'
                                  ? 'bg-sprout-water text-sprout-dark'
                                  : 'bg-card text-foreground'
                            )}
                          >
                            {member.role === 'owner' ? (
                              <Crown className="w-3.5 h-3.5" />
                            ) : member.role === 'admin' ? (
                              <Shield className="w-3.5 h-3.5" />
                            ) : (
                              <Users className="w-3.5 h-3.5" />
                            )}
                          </div>
                        ))}
                        {household.member_count > 4 && (
                          <div className="w-8 h-8 rounded-full border-2 border-field bg-card flex items-center justify-center">
                            <span className="text-xs font-bold text-foreground">+{household.member_count - 4}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {household.member_count} member{household.member_count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        to={`/households/${household.id}`}
                        className="flex-1 h-12 rounded-2xl bg-sprout-dark text-sprout-cream font-bold text-[15px] inline-flex items-center justify-center gap-2 shadow-[inset_0_0_0_2px_#dfc490]"
                      >
                        <Settings className="w-4 h-4" />
                        Manage
                      </Link>
                      {canInvite && (
                        <button
                          type="button"
                          onClick={() => handleInviteMember(household.id)}
                          aria-label={`Invite someone to ${household.name}`}
                          className="w-12 h-12 shrink-0 rounded-2xl bg-field text-foreground flex items-center justify-center hover:bg-sprout-water hover:text-sprout-dark transition-colors"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </CascadingContainer>
              );
            })}
          </div>
        )}
        </LoadingTransition>
        </div>

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
