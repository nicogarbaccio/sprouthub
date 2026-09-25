import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { FieldLabel, settingsInputClasses, settingsPrimaryButtonClasses } from "@/components/settings/SettingsUI";
import { authToast } from "@/utils/notifications/toast";
import { PasswordInput } from "./PasswordInput";

interface ResetPasswordFormProps {
 isLoading: boolean;
 onVerifyResetToken: (
 email: string,
 token: string,
 password: string
 ) => Promise<{ error?: { message: string } } | void>;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
 isLoading,
 onVerifyResetToken,
}) => {
 const [formData, setFormData] = useState({
 email: "",
 token: "",
 password: "",
 confirmPassword: "",
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!formData.email) {
  authToast.resetPasswordError("Please enter your email address");
  return;
 }

 if (!formData.token) {
  authToast.resetPasswordError(
  "Please enter the reset token from your email"
  );
  return;
 }

 if (formData.password !== formData.confirmPassword) {
  authToast.resetPasswordError("Passwords don't match");
  return;
 }

 if (formData.password.length < 6) {
  authToast.resetPasswordError(
  "Password must be at least 6 characters long"
  );
  return;
 }

 const { error } =
  (await onVerifyResetToken(
  formData.email,
  formData.token,
  formData.password
  )) || {};
 if (error) {
  authToast.resetPasswordError(error.message);
 } else {
  authToast.passwordUpdated();
 }
 };

 const isFormValid =
 formData.email.length > 0 &&
 formData.token.length > 0 &&
 formData.password.length >= 6 &&
 formData.password === formData.confirmPassword;

 return (
 <form onSubmit={handleSubmit} className="space-y-3">
  <div className="space-y-1 px-1">
  <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-foreground">Reset your password</h3>
  <p className="text-sm text-muted-foreground">Enter the code from your email and choose a new password.</p>
  </div>

  <div>
  <FieldLabel htmlFor="email">Email Address</FieldLabel>
  <Input
   id="email"
   type="email"
   placeholder="Enter your email"
   value={formData.email}
   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
   required
   inputMode="email"
   autoComplete="email"
   data-testid="reset-email"
   className={settingsInputClasses}
  />
  </div>

  <div>
  <FieldLabel htmlFor="token">Reset Token</FieldLabel>
  <Input
   id="token"
   type="text"
   placeholder="Enter 6-digit token from email"
   value={formData.token}
   onChange={(e) => setFormData({ ...formData, token: e.target.value })}
   required
   maxLength={6}
   inputMode="numeric"
   autoComplete="one-time-code"
   data-testid="reset-token"
   className={settingsInputClasses}
  />
  </div>

  <div>
  <PasswordInput
   id="new-password"
   label="New Password"
   placeholder="Enter new password"
   value={formData.password}
   onChange={(value) => setFormData({ ...formData, password: value })}
   required
   autoComplete="new-password"
  />
  </div>

  <div>
  <PasswordInput
   id="confirm-password"
   label="Confirm New Password"
   placeholder="Confirm new password"
   value={formData.confirmPassword}
   onChange={(value) =>
   setFormData({ ...formData, confirmPassword: value })
   }
   required
   autoComplete="new-password"
  />
  </div>

  <button
  type="submit"
  className={settingsPrimaryButtonClasses}
  disabled={isLoading || !isFormValid}
  data-testid="update-password-button"
  >
  {isLoading ? "Updating..." : "Update Password"}
  </button>
 </form>
 );
};

export default ResetPasswordForm;
