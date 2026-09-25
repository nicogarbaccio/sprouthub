import ProfileInformation from "@/components/profile/ProfileInformation";
import SecuritySettings from "@/components/profile/SecuritySettings";
import DangerZone from "@/components/profile/DangerZone";
import { useProfile } from "@/hooks/useProfile";
import { SettingsCard } from "./SettingsUI";
import { Skeleton } from "@/components/ui/skeleton";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { Link } from "react-router-dom";
import { FileText, Scale, ChevronRight } from "lucide-react";

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
      <div className="space-y-3">
        <Skeleton className="h-96 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
        <SettingsCard title="Legal & About" description="Review our policies and terms" icon={FileText}>
          <LegalLink to="/privacy-policy" icon={FileText} title="Privacy Policy" body="How we handle your data" />
          <LegalLink to="/terms-of-service" icon={Scale} title="Terms of Service" body="Rules and guidelines" />
        </SettingsCard>
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

const LegalLink = ({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: string;
  icon: React.ElementType;
  title: string;
  body: string;
}) => (
  <Link
    to={to}
    className="flex items-center gap-3 rounded-[18px] bg-field px-4 py-3.5 hover:bg-field/70 transition-colors"
  >
    <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
    <span className="flex-1 min-w-0">
      <span className="block text-[15px] font-bold text-foreground">{title}</span>
      <span className="block text-[13px] text-muted-foreground">{body}</span>
    </span>
    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
  </Link>
);
