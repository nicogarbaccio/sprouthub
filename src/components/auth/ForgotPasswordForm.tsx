import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { authToast } from "@/utils/notifications/toast";

interface ForgotPasswordFormProps {
 isLoading: boolean;
 onResetPassword: (
 email: string
 ) => Promise<{ error?: { message: string } } | void>;
 onBackToSignIn: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
 isLoading,
 onResetPassword,
 onBackToSignIn,
}) => {
 const [email, setEmail] = useState("");
 const [isSubmitted, setIsSubmitted] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const { error } = (await onResetPassword(email)) || {};
 if (error) {
  authToast.resetPasswordError(error.message);
 } else {
  setIsSubmitted(true);
  authToast.resetPasswordSent();
 }
 };

 if (isSubmitted) {
 return (
  <div className="space-y-4 text-center">
  <div className="space-y-2">
   <h3 className="text-lg font-medium">Check your email</h3>
   <p className="text-sm text-muted-foreground">
   We've sent a 6-digit verification code to <strong>{email}</strong>
   </p>
   <p className="text-sm text-muted-foreground">
   Once you receive the code, go to the{" "}
   <a
    href="/reset-password"
    className="text-sprout-dark dark:text-sprout-cream hover:text-sprout-primary dark:hover:text-sprout-light underline font-semibold bg-sprout-neutral/10 dark:bg-sprout-dark/20 px-1 py-0.5 rounded transition-colors"
   >
    Reset Password page
   </a>{" "}
   to enter your code and set a new password.
   </p>
  </div>
  <div className="space-y-2">
   <Button
   type="button"
   onClick={() => (window.location.href = "/reset-password")}
   className="w-full bg-sprout-light hover:bg-sprout-medium text-sprout-white"
   >
   Go to Reset Password Page
   </Button>
   <Button
   type="button"
   variant="outline"
   onClick={onBackToSignIn}
   className="w-full"
   >
   <ArrowLeft className="w-4 h-4 mr-2" />
   Back to Sign In
   </Button>
  </div>
  </div>
 );
 }

 return (
 <form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2 text-center">
  <h3 className="text-lg font-medium">Forgot your password?</h3>
  <p className="text-sm text-muted-foreground">
   Enter your email address and we'll send you a 6-digit verification
   code to reset your password.
  </p>
  </div>

  <div className="space-y-2">
  <Label htmlFor="reset-email">Email</Label>
  <Input
   id="reset-email"
   type="email"
   placeholder="Enter your email"
   value={email}
   onChange={(e) => setEmail(e.target.value)}
   required
   inputMode="email"
   autoComplete="email"
   data-testid="reset-password-email"
  />
  </div>

  <div className="space-y-2">
  <Button
   type="submit"
   className="w-full bg-sprout-light hover:bg-sprout-medium text-sprout-white"
   disabled={isLoading || !email}
   data-testid="reset-password-button"
  >
   {isLoading ? "Sending..." : "Send Verification Code"}
  </Button>

  <Button
   type="button"
   variant="outline"
   onClick={onBackToSignIn}
   className="w-full"
  >
   <ArrowLeft className="w-4 h-4 mr-2" />
   Back to Sign In
  </Button>
  </div>
 </form>
 );
};

export default ForgotPasswordForm;
