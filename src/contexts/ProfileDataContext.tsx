import React, {
 createContext,
 useContext,
 useEffect,
 useState,
 useCallback,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
 first_name: string;
 last_name: string;
 username: string;
 email: string;
 avatar_url?: string;
}

interface ProfileDataContextType {
 profileData: ProfileData;
 isLoading: boolean;
 updateProfileData: (updates: Partial<ProfileData>) => void;
 refreshProfileData: () => Promise<void>;
}

const ProfileDataContext = createContext<ProfileDataContextType | undefined>(
 undefined
);

export const useProfileData = () => {
 const context = useContext(ProfileDataContext);
 if (!context) {
 throw new Error("useProfileData must be used within a ProfileDataProvider");
 }
 return context;
};

export const ProfileDataProvider: React.FC<{ children: React.ReactNode }> = ({
 children,
}) => {
 const { user } = useAuth();
 const [profileData, setProfileData] = useState<ProfileData>({
 first_name: "",
 last_name: "",
 username: "",
 email: "",
 avatar_url: "",
 });
 const [isLoading, setIsLoading] = useState(false);
 const [hasInitialized, setHasInitialized] = useState(false);

 const fetchProfileData = useCallback(async () => {
 if (!user) {
  setProfileData({
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  avatar_url: "",
  });
  setHasInitialized(false);
  return;
 }

 // Only show loading for the initial fetch, not subsequent refreshes
 if (!hasInitialized) {
  setIsLoading(true);
 }

 try {
  const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

  if (error) {
  console.warn("Could not fetch profile data:", error);
  // Use user email as fallback
  setProfileData({
   first_name: "",
   last_name: "",
   username: "",
   email: user.email || "",
   avatar_url: "",
  });
  return;
  }

  setProfileData({
  first_name: data.first_name || "",
  last_name: data.last_name || "",
  username: data.username || "",
  email: data.email || user.email || "",
  avatar_url: data.avatar_url || "",
  });
  setHasInitialized(true);
 } catch (error) {
  console.warn("Error fetching profile:", error);
 } finally {
  setIsLoading(false);
 }
 }, [user]);

 const updateProfileData = (updates: Partial<ProfileData>) => {
 setProfileData((prev) => ({ ...prev, ...updates }));
 };

 const refreshProfileData = async () => {
 await fetchProfileData();
 };

 // Only fetch profile data once when user changes or on initial load
 useEffect(() => {
 if (user?.id && !hasInitialized) {
  fetchProfileData();
 } else if (!user) {
  setProfileData({
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  avatar_url: "",
  });
  setHasInitialized(false);
 }
 }, [user?.id, hasInitialized, fetchProfileData]);

 const value: ProfileDataContextType = {
 profileData,
 isLoading,
 updateProfileData,
 refreshProfileData,
 };

 return (
 <ProfileDataContext.Provider value={value}>
  {children}
 </ProfileDataContext.Provider>
 );
};
