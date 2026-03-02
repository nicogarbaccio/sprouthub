import React, {
 createContext,
 useContext,
 useEffect,
 useState,
 useCallback,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { hookLogger } from "@/utils/hookLogging";

const CONTEXT_NAME = 'ProfileDataContext';
const PROFILE_CACHE_KEY = 'sprouthub_profile_cache';

interface ProfileData {
 first_name: string;
 last_name: string;
 username: string;
 email: string;
 avatar_url?: string;
}

/** Read cached profile from localStorage for instant display. */
function getCachedProfile(): ProfileData {
 const empty: ProfileData = { first_name: "", last_name: "", username: "", email: "", avatar_url: "" };
 try {
  const raw = localStorage.getItem(PROFILE_CACHE_KEY);
  if (!raw) return empty;
  const parsed = JSON.parse(raw);
  return { ...empty, ...parsed };
 } catch {
  return empty;
 }
}

/** Persist a snapshot so the next page load can display the name instantly. */
function setCachedProfile(data: ProfileData) {
 try {
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
   first_name: data.first_name,
   last_name: data.last_name,
   username: data.username,
  }));
 } catch { /* ignore quota errors */ }
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
 const [profileData, setProfileData] = useState<ProfileData>(getCachedProfile);
 const [isLoading, setIsLoading] = useState(false);
 const [hasInitialized, setHasInitialized] = useState(false);

 const fetchProfileData = useCallback(async () => {
 if (!user) {
  setProfileData({ first_name: "", last_name: "", username: "", email: "", avatar_url: "" });
  try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch { /* ignore */ }
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
  hookLogger.warn(CONTEXT_NAME, "Could not fetch profile data", { error });
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

  const fetched: ProfileData = {
  first_name: data.first_name || "",
  last_name: data.last_name || "",
  username: data.username || "",
  email: data.email || user.email || "",
  avatar_url: data.avatar_url || "",
  };
  setProfileData(fetched);
  setCachedProfile(fetched);
  setHasInitialized(true);
 } catch (error) {
  hookLogger.warn(CONTEXT_NAME, "Error fetching profile", { error });
 } finally {
  setIsLoading(false);
 }
 }, [user]);

 const updateProfileData = (updates: Partial<ProfileData>) => {
 setProfileData((prev) => {
  const next = { ...prev, ...updates };
  setCachedProfile(next);
  return next;
 });
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
