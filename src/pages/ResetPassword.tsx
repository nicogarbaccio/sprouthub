import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { AuthShell } from "@/components/auth/AuthUI";

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
 <AuthShell description="Create a new password for your account">
  <ResetPasswordForm
   isLoading={isLoading}
   onVerifyResetToken={handleVerifyResetToken}
  />
 </AuthShell>
 );
};

export default ResetPassword;
