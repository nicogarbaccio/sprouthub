import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Droplets } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authToast } from "@/utils/toast-helpers";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo";

const Auth = () => {
 const [isLoading, setIsLoading] = useState(false);
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const { signUp, signIn, user } = useAuth();
 const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);

 useEffect(() => {
  if (user && !hasShownSuccessToast) {
   // Show success toast when user signs in
   authToast.signInSuccess();
   setHasShownSuccessToast(true);

   // Navigate after a short delay to let user see the toast
   setTimeout(() => {
    const redirectTo = searchParams.get("redirect") || "/";
    navigate(redirectTo);
   }, 1000);
  }
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
  <div className="min-h-screen bg-background ">
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
