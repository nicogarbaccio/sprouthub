import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authToast } from "@/utils/toast-helpers";
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
 <form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2 text-center">
  <h3 className="text-lg font-medium">Reset your password</h3>
  <p className="text-sm text-muted-foreground">
   Enter the token from your email and your new password.
  </p>
  </div>

  <div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input
   id="email"
   type="email"
   placeholder="Enter your email"
   value={formData.email}
   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
   required
   data-testid="reset-email"
  />
  </div>

  <div className="space-y-2">
  <Label htmlFor="token">Reset Token</Label>
  <Input
   id="token"
   type="text"
   placeholder="Enter 6-digit token from email"
   value={formData.token}
   onChange={(e) => setFormData({ ...formData, token: e.target.value })}
   required
   maxLength={6}
   data-testid="reset-token"
  />
  </div>

  <div className="space-y-2">
  <PasswordInput
   id="new-password"
   label="New Password"
   placeholder="Enter new password"
   value={formData.password}
   onChange={(value) => setFormData({ ...formData, password: value })}
   required
  />
  </div>

  <div className="space-y-2">
  <PasswordInput
   id="confirm-password"
   label="Confirm New Password"
   placeholder="Confirm new password"
   value={formData.confirmPassword}
   onChange={(value) =>
   setFormData({ ...formData, confirmPassword: value })
   }
   required
  />
  </div>

  <Button
  type="submit"
  className="w-full bg-sprout-light hover:bg-sprout-medium text-sprout-white"
  disabled={isLoading || !isFormValid}
  data-testid="update-password-button"
  >
  {isLoading ? "Updating..." : "Update Password"}
  </Button>
 </form>
 );
};

export default ResetPasswordForm;
