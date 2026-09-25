import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authToast } from "@/utils/notifications/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";
import { AuthShell } from "@/components/auth/AuthUI";
import { supabase } from "@/integrations/supabase/client";

/**
 * Validates a redirect path to prevent open redirect attacks.
 * Only allows relative paths that start with "/" and don't start with "//".
 */
function getSafeRedirect(searchParams: URLSearchParams): string {
  const redirectTo = searchParams.get("redirect") || "/";
  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return redirectTo;
  }
  return "/";
}

const Auth = () => {
 const [isLoading, setIsLoading] = useState(false);
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const { signUp, signIn, user } = useAuth();
 const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);
 const isCheckingOnboardingRef = useRef(false);

 useEffect(() => {
 const checkOnboardingStatus = async () => {
  if (user && !hasShownSuccessToast && !isCheckingOnboardingRef.current) {
   isCheckingOnboardingRef.current = true;

   try {
    // Fetch user profile to check onboarding status
    const { data: profile, error } = await supabase
     .from("profiles")
     .select("onboarding_completed")
     .eq("id", user.id)
     .single();

    if (error) {
     console.error("Error fetching profile:", error);
     // If there's an error, default to regular flow
     authToast.signInSuccess();
     setHasShownSuccessToast(true);
     setTimeout(() => {
      navigate(getSafeRedirect(searchParams));
     }, 100);
     return;
    }

    // Check if user needs onboarding
    const needsOnboarding = !profile?.onboarding_completed;

    if (needsOnboarding) {
     // New user - redirect to onboarding (toast already shown by SignUpForm)
     setHasShownSuccessToast(true);
     setTimeout(() => {
      navigate("/onboarding");
     }, 100);
    } else {
     // Returning user - show regular toast
     authToast.signInSuccess();
     setHasShownSuccessToast(true);
     setTimeout(() => {
      navigate(getSafeRedirect(searchParams));
     }, 100);
    }
   } catch (error) {
    console.error("Unexpected error:", error);
    authToast.signInSuccess();
    setHasShownSuccessToast(true);
    setTimeout(() => {
     navigate(getSafeRedirect(searchParams));
    }, 100);
   } finally {
    isCheckingOnboardingRef.current = false;
   }
  }
 };

 checkOnboardingStatus();
 }, [user, navigate, searchParams, hasShownSuccessToast]);

 const handleSignIn = async (emailOrUsername: string, password: string) => {
 setIsLoading(true);
 const result = await signIn(emailOrUsername, password);
 setIsLoading(false);
 return result;
 };

 const handleSignUp = async (
 email: string,
 password: string,
 firstName: string,
 lastName: string,
 username: string
 ) => {
 setIsLoading(true);
 const result = await signUp(email, password, firstName, lastName, username);
 setIsLoading(false);
 return result;
 };

 // Two halves of one segmented control rather than separate pills
 const tabClasses = "h-10 bg-transparent";

 return (
 <AuthShell description="Your personal plant care assistant">
  <Tabs defaultValue="signin" className="w-full">
  <TabsList className="grid w-full grid-cols-2 gap-0 p-1 rounded-full bg-field">
   <TabsTrigger data-testid="sign-in-trigger" value="signin" className={tabClasses}>
   Sign In
   </TabsTrigger>
   <TabsTrigger data-testid="sign-up-trigger" value="signup" className={tabClasses}>
   Sign Up
   </TabsTrigger>
  </TabsList>
  <TabsContent value="signin" className="mt-5">
   <SignInForm isLoading={isLoading} onSignIn={handleSignIn} />
  </TabsContent>
  <TabsContent value="signup" className="mt-5">
   <SignUpForm isLoading={isLoading} onSignUp={handleSignUp} />
  </TabsContent>
  </Tabs>
 </AuthShell>
 );
};

export default Auth;
