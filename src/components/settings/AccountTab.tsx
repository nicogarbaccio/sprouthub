import React from "react";
import ProfileInformation from "@/components/profile/ProfileInformation";
import SecuritySettings from "@/components/profile/SecuritySettings";
import DangerZone from "@/components/profile/DangerZone";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { Link } from "react-router-dom";
import { FileText, Scale, ExternalLink } from "lucide-react";

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
        <Card>
          <CardHeader>
            <CardTitle>Legal & About</CardTitle>
            <CardDescription>
              Review our policies and terms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/privacy-policy"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Privacy Policy</p>
                  <p className="text-sm text-muted-foreground">
                    How we handle your data
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/terms-of-service"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Terms of Service</p>
                  <p className="text-sm text-muted-foreground">
                    Rules and guidelines
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardContent>
        </Card>
      </CascadingContainer>

      <CascadingContainer delay={250}>
        <DangerZone
          handleDeleteAccount={handleDeleteAccount}
          isLoading={isLoading}
        />
      </CascadingContainer>
    </div>
  );
};
