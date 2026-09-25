import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { FieldLabel, settingsInputClasses, settingsPrimaryButtonClasses, settingsSecondaryButtonClasses } from "@/components/settings/SettingsUI";
import { ArrowLeft, MailCheck } from "lucide-react";
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
  <div className="space-y-4">
  <div className="flex items-start gap-3.5">
   <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-success text-sprout-dark flex items-center justify-center">
   <MailCheck className="w-5 h-5" />
   </div>
   <div className="space-y-1.5">
   <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-foreground">Check your email</h3>
   <p className="text-sm text-muted-foreground">
    We've sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>
   </p>
   <p className="text-sm text-muted-foreground">
    Once it arrives, go to the{" "}
    <a href="/reset-password" className="font-bold text-link underline underline-offset-2">
    Reset Password page
    </a>{" "}
    to enter your code and set a new password.
   </p>
   </div>
  </div>
  <div className="space-y-2">
   <button
   type="button"
   onClick={() => (window.location.href = "/reset-password")}
   className={settingsPrimaryButtonClasses}
   >
   Go to Reset Password Page
   </button>
   <button type="button" onClick={onBackToSignIn} className={`${settingsSecondaryButtonClasses} w-full`}>
   <ArrowLeft className="w-4 h-4" />
   Back to Sign In
   </button>
  </div>
  </div>
 );
 }

 return (
 <form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-1 px-1">
  <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-foreground">Forgot your password?</h3>
  <p className="text-sm text-muted-foreground">
   Enter your email and we'll send you a 6-digit code to reset it.
  </p>
  </div>

  <div>
  <FieldLabel htmlFor="reset-email">Email</FieldLabel>
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
   className={settingsInputClasses}
  />
  </div>

  <div className="space-y-2">
  <button
   type="submit"
   className={settingsPrimaryButtonClasses}
   disabled={isLoading || !email}
   data-testid="reset-password-button"
  >
   {isLoading ? "Sending..." : "Send Verification Code"}
  </button>

  <button type="button" onClick={onBackToSignIn} className={`${settingsSecondaryButtonClasses} w-full`}>
   <ArrowLeft className="w-4 h-4" />
   Back to Sign In
  </button>
  </div>
 </form>
 );
};

export default ForgotPasswordForm;
