import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
    <div className="min-h-dvh bg-background pb-28 lg:pb-0">
      <Navigation />
      <main className="pt-20 min-h-[calc(100vh-4rem)] bg-plant-neutral dark:bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <CascadingContainer delay={0}>
            <ProfileHeader />
          </CascadingContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CascadingContainer delay={100}>
              <ProfileInformation
                profileData={profileData}
                setProfileData={setProfileData}
                handleUpdateProfile={handleUpdateProfile}
                isLoading={isLoading}
                hasProfileChanges={hasProfileChanges}
              />
            </CascadingContainer>

            <div className="space-y-6">
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
      <Footer />
    </div>
  );
};

export default Profile;
