import React from "react";
import ProfileInformation from "@/components/profile/ProfileInformation";
import SecuritySettings from "@/components/profile/SecuritySettings";
import DangerZone from "@/components/profile/DangerZone";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CascadingContainer } from "@/components/ui/cascading-container";

export const AccountTab = () => {
  const {
    profileData,
    setProfileData,
    passwordData,
    setPasswordData,
    isLoading,
    isLoadingProfile,
    handleUpdateProfile,
    handleChangePassword,
    handleDeleteAccount,
    hasProfileChanges,
    hasValidPasswordChanges,
  } = useProfile();

  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-48" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CascadingContainer delay={0}>
        <ProfileInformation
          profileData={profileData}
          setProfileData={setProfileData}
          handleUpdateProfile={handleUpdateProfile}
          isLoading={isLoading}
          hasProfileChanges={hasProfileChanges}
        />
      </CascadingContainer>

      <CascadingContainer delay={100}>
        <SecuritySettings
          passwordData={passwordData}
          setPasswordData={setPasswordData}
          handleChangePassword={handleChangePassword}
          isLoading={isLoading}
          hasValidPasswordChanges={hasValidPasswordChanges}
        />
      </CascadingContainer>

      <CascadingContainer delay={200}>
        <DangerZone
          handleDeleteAccount={handleDeleteAccount}
          isLoading={isLoading}
        />
      </CascadingContainer>
    </div>
  );
};
