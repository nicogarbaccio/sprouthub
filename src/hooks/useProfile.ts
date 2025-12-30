import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/contexts/ProfileDataContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { hookLogger } from "@/utils/hookLogging";

const HOOK_NAME = 'useProfile';

interface ProfileData {
 first_name: string;
 last_name: string;
 username: string;
 email: string;
 avatar_url?: string;
}

interface PasswordData {
 currentPassword: string;
 newPassword: string;
 confirmPassword: string;
}

export const useProfile = () => {
 const { user, loading: authLoading, signOut } = useAuth();
 const { updateProfileData } = useProfileData();
 const navigate = useNavigate();
 const { toast } = useToast();
 
 const [profileData, setProfileData] = useState<ProfileData>({
 first_name: "",
 last_name: "",
 username: "",
 email: "",
 avatar_url: "",
 });

 // Track original profile data for change detection
 const [originalProfileData, setOriginalProfileData] = useState<ProfileData>({
 first_name: "",
 last_name: "",
 username: "",
 email: "",
 avatar_url: "",
 });
 
 const [passwordData, setPasswordData] = useState<PasswordData>({
 currentPassword: "",
 newPassword: "",
 confirmPassword: "",
 });
 
 const [isLoading, setIsLoading] = useState(false);
 const [isLoadingProfile, setIsLoadingProfile] = useState(true);

 useEffect(() => {
 // Don't make auth decisions while auth is still loading
 if (authLoading) {
  return;
 }

 if (!user) {
  toast({
  title: "Authentication Required",
  description: "Please sign in to access your profile.",
  variant: "default",
  });
  navigate("/");
  return;
 }
 fetchProfile();
 }, [user, authLoading, navigate]);

 const fetchProfile = async () => {
 if (!user) return;
 
 try {
  const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

  if (error) throw error;

  const fetchedProfileData = {
  first_name: data.first_name || "",
  last_name: data.last_name || "",
  username: data.username || "",
  email: data.email || user.email || "",
  avatar_url: data.avatar_url || "",
  };

  setProfileData(fetchedProfileData);
  setOriginalProfileData(fetchedProfileData);
 } catch (error) {
  hookLogger.error(HOOK_NAME, "Error fetching profile:", error);
  toast({
  title: "Error",
  description: "Failed to load profile data",
  variant: "destructive",
  });
 } finally {
  setIsLoadingProfile(false);
 }
 };

 const handleUpdateProfile = async () => {
 if (!user) return;
 
 setIsLoading(true);
 try {
  // Check if username is unique (if changed)
  const { data: existingUser } = await supabase
  .from("profiles")
  .select("username")
  .eq("username", profileData.username)
  .neq("id", user.id)
  .single();

  if (existingUser) {
  toast({
   title: "Error",
   description: "Username already exists. Please choose a different one.",
   variant: "destructive",
  });
  return;
  }

  const { error } = await supabase
  .from("profiles")
  .update({
   first_name: profileData.first_name,
   last_name: profileData.last_name,
   username: profileData.username,
   avatar_url: profileData.avatar_url,
  })
  .eq("id", user.id);

  if (error) throw error;

  // Update the global profile data context
  updateProfileData({
  first_name: profileData.first_name,
  last_name: profileData.last_name,
  username: profileData.username,
  avatar_url: profileData.avatar_url,
  });

  // Update original data to reflect the saved state
  setOriginalProfileData(profileData);

  toast({
  title: "Success",
  description: "Profile updated successfully",
  });
 } catch (error) {
  hookLogger.error(HOOK_NAME, "Error updating profile:", error);
  toast({
  title: "Error",
  description: "Failed to update profile",
  variant: "destructive",
  });
 } finally {
  setIsLoading(false);
 }
 };

 const handleChangePassword = async () => {
 if (passwordData.newPassword !== passwordData.confirmPassword) {
  toast({
  title: "Error",
  description: "New passwords don't match",
  variant: "destructive",
  });
  return;
 }

 if (passwordData.newPassword.length < 6) {
  toast({
  title: "Error",
  description: "Password must be at least 6 characters long",
  variant: "destructive",
  });
  return;
 }

 setIsLoading(true);
 try {
  const { error } = await supabase.auth.updateUser({
  password: passwordData.newPassword,
  });

  if (error) throw error;

  setPasswordData({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  });

  toast({
  title: "Success",
  description: "Password updated successfully",
  });
 } catch (error) {
  hookLogger.error(HOOK_NAME, "Error updating password:", error);
  toast({
  title: "Error",
  description: "Failed to update password",
  variant: "destructive",
  });
 } finally {
  setIsLoading(false);
 }
 };

 const handleDeleteAccount = async () => {
 setIsLoading(true);
 try {
  // Delete user plants first
  await supabase
  .from("user_plants")
  .delete()
  .eq("user_id", user?.id);

  // Delete profile
  await supabase
  .from("profiles")
  .delete()
  .eq("id", user?.id);

  // Sign out and redirect
  await signOut();
  navigate("/");
  
  toast({
  title: "Account deleted",
  description: "Your account has been permanently deleted",
  });
 } catch (error) {
  hookLogger.error(HOOK_NAME, "Error deleting account:", error);
  toast({
  title: "Error",
  description: "Failed to delete account",
  variant: "destructive",
  });
 } finally {
  setIsLoading(false);
 }
 };

 // Check if profile data has changed from original values
 const hasProfileChanges = () => {
 return (
  profileData.first_name !== originalProfileData.first_name ||
  profileData.last_name !== originalProfileData.last_name ||
  profileData.username !== originalProfileData.username ||
  profileData.avatar_url !== originalProfileData.avatar_url
 );
 };

 // Check if password data is valid for submission
 const hasValidPasswordChanges = () => {
 return (
  passwordData.newPassword.length >= 6 &&
  passwordData.confirmPassword.length >= 6 &&
  passwordData.newPassword === passwordData.confirmPassword
 );
 };

 return {
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
 };
};
