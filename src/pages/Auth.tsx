import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authToast } from "@/utils/notifications/toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo";
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

 return (
 <div className="min-h-dvh bg-background pb-20 lg:pb-0 ">
  <Navigation />
  <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-plant-primary/10 to-plant-secondary/10 dark:bg-background flex items-center justify-center p-4">
  <Card className="w-full max-w-md">
   <CardHeader className="text-center">
   <div className="flex items-center justify-center gap-3 mb-4">
    <ThemeAwareLogo className="h-12 w-auto" />
    <span className="text-3xl font-bold text-sprout-dark dark:text-sprout-cream ">
    sprouthub
    </span>
   </div>
   <CardDescription>
    Your personal plant care assistant
   </CardDescription>
   </CardHeader>
   <CardContent>
   <Tabs defaultValue="signin" className="w-full">
    <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger data-testid="sign-in-trigger" value="signin">
     Sign In
    </TabsTrigger>
    <TabsTrigger data-testid="sign-up-trigger" value="signup">
     Sign Up
    </TabsTrigger>
    </TabsList>
    <TabsContent value="signin">
    <SignInForm isLoading={isLoading} onSignIn={handleSignIn} />
    </TabsContent>
    <TabsContent value="signup">
    <SignUpForm isLoading={isLoading} onSignUp={handleSignUp} />
    </TabsContent>
   </Tabs>
   </CardContent>
  </Card>
  </div>
  <Footer />
 </div>
 );
};

export default Auth;
