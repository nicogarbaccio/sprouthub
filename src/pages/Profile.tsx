import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileInformation from "@/components/profile/ProfileInformation";
import SecuritySettings from "@/components/profile/SecuritySettings";
import DangerZone from "@/components/profile/DangerZone";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { useProfile } from "@/hooks/useProfile";

const Profile = () => {
  const {
    profileData,
    setProfileData,
    passwordData,
    setPasswordData,
    isLoading,
    handleUpdateProfile,
    handleChangePassword,
    handleDeleteAccount,
    hasProfileChanges,
    hasValidPasswordChanges,
  } = useProfile();

  return (
    <div className="bg-background pb-32 lg:pb-10">
      <main className="px-4 lg:px-8 pt-3.5 lg:pt-7">
        <div className="max-w-5xl mx-auto space-y-[18px]">
          <CascadingContainer delay={0}>
            <ProfileHeader />
          </CascadingContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
            <CascadingContainer delay={100}>
              <ProfileInformation
                profileData={profileData}
                setProfileData={setProfileData}
                handleUpdateProfile={handleUpdateProfile}
                isLoading={isLoading}
                hasProfileChanges={hasProfileChanges}
              />
            </CascadingContainer>

            <div className="space-y-3">
              <CascadingContainer delay={200}>
                <SecuritySettings
                  passwordData={passwordData}
                  setPasswordData={setPasswordData}
                  handleChangePassword={handleChangePassword}
                  isLoading={isLoading}
                  hasValidPasswordChanges={hasValidPasswordChanges}
                />
              </CascadingContainer>

              <CascadingContainer delay={300}>
                <DangerZone
                  handleDeleteAccount={handleDeleteAccount}
                  isLoading={isLoading}
                />
              </CascadingContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
