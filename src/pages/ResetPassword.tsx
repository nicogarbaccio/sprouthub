import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo";

const ResetPassword = () => {
 const [isLoading, setIsLoading] = useState(false);
 const navigate = useNavigate();
 const { user, verifyResetToken } = useAuth();

 // Redirect if already logged in
 useEffect(() => {
 if (user) {
  navigate("/");
 }
 }, [user, navigate]);

 const handleVerifyResetToken = async (
 email: string,
 token: string,
 password: string
 ) => {
 setIsLoading(true);
 const result = await verifyResetToken(email, token, password);
 setIsLoading(false);

 if (!result.error) {
  // Navigate to auth page after successful password reset
  setTimeout(() => {
  navigate("/auth");
  }, 2000);
 }

 return result;
 };

 return (
 <div className="min-h-dvh bg-background pb-28 lg:pb-0 ">
  <Navigation />
  <main className="pt-20 min-h-[calc(100vh-4rem)] bg-plant-neutral dark:bg-background flex items-center justify-center py-8 px-4">
  <div className="w-full max-w-md space-y-6">
   <div className="text-center">
   <ThemeAwareLogo className="h-12 w-auto mx-auto mb-4" />
   <h1 className="text-3xl font-bold text-sprout-primary dark:text-sprout-cream">
    sprouthub
   </h1>
   </div>

   <Card>
   <CardHeader className="text-center">
    <CardTitle>Reset Password</CardTitle>
    <CardDescription>
    Create a new password for your account
    </CardDescription>
   </CardHeader>
   <CardContent>
    <ResetPasswordForm
    isLoading={isLoading}
    onVerifyResetToken={handleVerifyResetToken}
    />
   </CardContent>
   </Card>
  </div>
  </main>
  <Footer />
 </div>
 );
};

export default ResetPassword;
