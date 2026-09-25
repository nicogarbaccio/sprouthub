import React from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
 SettingsCard,
 FieldLabel,
 settingsInputClasses,
 settingsPrimaryButtonClasses,
} from "@/components/settings/SettingsUI";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import ImageUpload from "@/components/ui/image-upload";

interface ProfileData {
 first_name: string;
 last_name: string;
 username: string;
 email: string;
 avatar_url?: string;
}

interface ProfileInformationProps {
 profileData: ProfileData;
 setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
 handleUpdateProfile: () => Promise<void>;
 isLoading: boolean;
 hasProfileChanges: () => boolean;
}

const ProfileInformation: React.FC<ProfileInformationProps> = ({
 profileData,
 setProfileData,
 handleUpdateProfile,
 isLoading,
 hasProfileChanges,
}) => {
 const getInitials = () => {
 return `${profileData.first_name.charAt(0)}${profileData.last_name.charAt(
  0
 )}`.toUpperCase();
 };

 return (
 <SettingsCard
  testId="profile-information-card"
  title="Profile Information"
  description="Your name, username and photo"
  icon={User}
 >
  <div className="flex items-center gap-4">
  <Avatar className="w-16 h-16 shrink-0">
   <AvatarImage src={profileData.avatar_url} className="rounded-full object-cover" />
   <AvatarFallback className="text-lg font-bold bg-sprout-cream text-sprout-dark rounded-full">
   {getInitials()}
   </AvatarFallback>
  </Avatar>
  <div className="flex-1 min-w-0">
   <ImageUpload
   value={profileData.avatar_url || ""}
   onChange={(url) =>
    setProfileData((prev) => ({ ...prev, avatar_url: url }))
   }
   label="Profile Picture"
   placeholder="Upload or enter avatar URL"
   showPreview={false}
   />
  </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
   <FieldLabel htmlFor="first_name">First Name</FieldLabel>
   <Input
   data-testid="first-name-input"
   id="first_name"
   value={profileData.first_name}
   onChange={(e) =>
    setProfileData((prev) => ({
    ...prev,
    first_name: e.target.value,
    }))
   }
   placeholder="Enter your first name"
   autoComplete="given-name"
   className={settingsInputClasses}
   />
  </div>

  <div>
   <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
   <Input
   data-testid="last-name-input"
   id="last_name"
   value={profileData.last_name}
   onChange={(e) =>
    setProfileData((prev) => ({
    ...prev,
    last_name: e.target.value,
    }))
   }
   placeholder="Enter your last name"
   autoComplete="family-name"
   className={settingsInputClasses}
   />
  </div>
  </div>

  <div>
  <FieldLabel htmlFor="username">Username</FieldLabel>
  <Input
   data-testid="username-input"
   id="username"
   value={profileData.username}
   onChange={(e) =>
   setProfileData((prev) => ({ ...prev, username: e.target.value }))
   }
   placeholder="Enter your username"
   autoComplete="username"
   className={settingsInputClasses}
  />
  </div>

  <div>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input
   data-testid="email-input"
   id="email"
   type="email"
   value={profileData.email}
   disabled
   autoComplete="email"
   className={cn(settingsInputClasses, "disabled:opacity-70")}
  />
  <p className="text-[13px] text-muted-foreground px-1 mt-1.5">
   Email can't be changed from here
  </p>
  </div>

  <button
  type="button"
  data-testid="update-profile-button"
  onClick={handleUpdateProfile}
  disabled={isLoading || !hasProfileChanges()}
  className={cn(settingsPrimaryButtonClasses, "mt-2")}
  >
  {isLoading ? "Updating..." : "Update Profile"}
  </button>
 </SettingsCard>
 );
};

export default ProfileInformation;
