import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { AuthShell } from "@/components/auth/AuthUI";

const ForgotPassword = () => {
 const [isLoading, setIsLoading] = useState(false);
 const navigate = useNavigate();
 const { resetPassword, user } = useAuth();

 // Redirect to home if already logged in
 useEffect(() => {
 if (user) {
  navigate("/");
 }
 }, [user, navigate]);

 const handleResetPassword = async (email: string) => {
 setIsLoading(true);
 const result = await resetPassword(email);
 setIsLoading(false);
 return result;
 };

 const handleBackToSignIn = () => {
 navigate("/auth");
 };

 return (
 <AuthShell description="Reset your password">
  <ForgotPasswordForm
   isLoading={isLoading}
   onResetPassword={handleResetPassword}
   onBackToSignIn={handleBackToSignIn}
  />
 </AuthShell>
 );
};

export default ForgotPassword;
