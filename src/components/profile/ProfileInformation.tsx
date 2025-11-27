import React from "react";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
 <Card data-testid="profile-information-card">
  <CardHeader>
  <div className="flex items-center space-x-2">
   <User className="w-5 h-5" />
   <CardTitle>Profile Information</CardTitle>
  </div>
  <CardDescription>
   Update your personal information and avatar
  </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
  <div className="space-y-4">
   <div className="flex justify-center">
   <Avatar className="w-24 h-24 border-2 border-border shadow-lg">
    <AvatarImage
    src={profileData.avatar_url}
    className="rounded-full"
    />
    <AvatarFallback className="text-lg font-semibold bg-sprout-pale dark:bg-sprout-medium text-sprout-primary dark:text-white rounded-full">
    {getInitials()}
    </AvatarFallback>
   </Avatar>
   </div>

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

  <Separator />

  <div className="grid grid-cols-2 gap-4">
   <div className="space-y-2">
   <Label htmlFor="first_name">First Name</Label>
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
   />
   </div>

   <div className="space-y-2">
   <Label htmlFor="last_name">Last Name</Label>
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
   />
   </div>
  </div>

  <div className="space-y-2">
   <Label htmlFor="username">Username</Label>
   <Input
   data-testid="username-input"
   id="username"
   value={profileData.username}
   onChange={(e) =>
    setProfileData((prev) => ({ ...prev, username: e.target.value }))
   }
   placeholder="Enter your username"
   />
  </div>

  <div className="space-y-2">
   <Label htmlFor="email">Email</Label>
   <Input
   data-testid="email-input"
   id="email"
   type="email"
   value={profileData.email}
   disabled
   className="bg-muted"
   />
   <p className="text-sm text-muted-foreground/70">
   Email cannot be changed from here
   </p>
  </div>

  <Button
   data-testid="update-profile-button"
   onClick={handleUpdateProfile}
   disabled={isLoading || !hasProfileChanges()}
   className={`w-full font-medium ${
   hasProfileChanges() && !isLoading
    ? "bg-sprout-success hover:bg-sprout-success/90 text-white"
    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-not-allowed"
   }`}
  >
   {isLoading ? "Updating..." : "Update Profile"}
  </Button>
  </CardContent>
 </Card>
 );
};

export default ProfileInformation;
